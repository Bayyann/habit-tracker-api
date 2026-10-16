from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..models import CheckIn, Habit, User
from ..schemas import CheckInResult, HabitCreate, HabitRead, HabitUpdate

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitRead])
def list_habits(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    completed_count = (
        select(func.count(CheckIn.id))
        .where(CheckIn.habit_id == Habit.id)
        .scalar_subquery()
    )
    statement = select(Habit, completed_count).where(Habit.user_id == current_user.id)
    return [
        HabitRead.model_validate(habit).model_copy(
            update={"completed_check_ins": count}
        )
        for habit, count in session.exec(statement).all()
    ]


@router.post("", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_data: HabitCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    name = habit_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Habit name cannot be empty")
    _validate_schedule(habit_data.goal_target, habit_data.deadline)

    habit = Habit(
        **habit_data.model_dump(exclude={"name"}),
        name=name,
        user_id=current_user.id,
    )
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return _habit_read(habit, session)


@router.get("/{habit_id}", response_model=HabitRead)
def get_habit(
    habit_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    habit = _get_owned_habit(habit_id, current_user, session)
    return _habit_read(habit, session)


@router.put("/{habit_id}", response_model=HabitRead)
def update_habit(
    habit_id: int,
    habit_data: HabitUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    habit = _get_owned_habit(habit_id, current_user, session)
    updates = habit_data.model_dump(exclude_unset=True)

    if "name" in updates:
        name = updates["name"]
        if name is None or not name.strip():
            raise HTTPException(status_code=400, detail="Habit name cannot be empty")
        updates["name"] = name.strip()
    goal_target = updates.get("goal_target", habit.goal_target)
    if goal_target is None:
        raise HTTPException(status_code=400, detail="goal_target must be greater than zero")
    deadline = updates.get("deadline", habit.deadline)
    completed_check_ins = _completed_check_ins(habit.id, session)
    _validate_schedule(goal_target, deadline, completed_check_ins)

    for field, value in updates.items():
        setattr(habit, field, value)
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return _habit_read(habit, session)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    habit = _get_owned_habit(habit_id, current_user, session)
    check_ins = session.exec(
        select(CheckIn).where(CheckIn.habit_id == habit_id)
    ).all()
    for check_in in check_ins:
        session.delete(check_in)
    session.delete(habit)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{habit_id}/check-in",
    response_model=CheckInResult,
    status_code=status.HTTP_201_CREATED,
)
def create_check_in(
    habit_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _get_owned_habit(habit_id, current_user, session)
    today = date.today()
    existing_check_in = session.exec(
        select(CheckIn).where(
            CheckIn.habit_id == habit_id,
            CheckIn.day == today,
        )
    ).first()
    if existing_check_in is not None:
        raise HTTPException(status_code=400, detail="Habit already checked in today")

    check_in = CheckIn(habit_id=habit_id, day=today)
    session.add(check_in)
    try:
        session.commit()
    except IntegrityError as exc:
        # The unique constraint also protects against two requests arriving together.
        session.rollback()
        raise HTTPException(status_code=400, detail="Habit already checked in today") from exc
    session.refresh(check_in)

    check_in_days = session.exec(
        select(CheckIn.day)
        .where(CheckIn.habit_id == habit_id)
        .order_by(CheckIn.day.desc())
    ).all()
    current_streak = _count_streak(check_in_days, today)
    return CheckInResult(
        check_in=check_in,
        current_streak=current_streak,
        completed_check_ins=len(check_in_days),
    )


def _completed_check_ins(habit_id: int, session: Session) -> int:
    return int(
        session.exec(
            select(func.count(CheckIn.id)).where(CheckIn.habit_id == habit_id)
        ).one()
    )


def _habit_read(habit: Habit, session: Session) -> HabitRead:
    return HabitRead.model_validate(habit).model_copy(
        update={"completed_check_ins": _completed_check_ins(habit.id, session)}
    )


def _validate_schedule(
    goal_target: int,
    deadline: date | None,
    completed_check_ins: int = 0,
) -> None:
    if goal_target < 1:
        raise HTTPException(status_code=400, detail="goal_target must be greater than zero")
    if deadline is None:
        return

    today = date.today()
    if deadline < today:
        raise HTTPException(status_code=400, detail="Deadline cannot be in the past")

    available_days = (deadline - today).days + 1
    remaining_check_ins = max(goal_target - completed_check_ins, 0)
    if remaining_check_ins > available_days:
        raise HTTPException(
            status_code=400,
            detail=(
                "Target check-ins exceed the number of days available before the "
                "deadline. Remove the deadline or lower the target."
            ),
        )


def _get_owned_habit(habit_id: int, current_user: User, session: Session) -> Habit:
    statement = select(Habit).where(
        Habit.id == habit_id,
        Habit.user_id == current_user.id,
    )
    habit = session.exec(statement).first()
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit


def _count_streak(check_in_days: list[date], today: date) -> int:
    days = set(check_in_days)
    streak = 0
    day = today
    while day in days:
        streak += 1
        day -= timedelta(days=1)
    return streak
