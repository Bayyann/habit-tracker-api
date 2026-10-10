from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..models import Habit, User
from ..schemas import HabitCreate, HabitRead, HabitUpdate

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitRead])
def list_habits(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    statement = select(Habit).where(Habit.user_id == current_user.id)
    return session.exec(statement).all()


@router.post("", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_data: HabitCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    name = habit_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Habit name cannot be empty")
    if habit_data.goal_target <= 0:
        raise HTTPException(status_code=400, detail="goal_target must be greater than zero")

    habit = Habit(
        **habit_data.model_dump(exclude={"name"}),
        name=name,
        user_id=current_user.id,
    )
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit


@router.get("/{habit_id}", response_model=HabitRead)
def get_habit(
    habit_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    habit = _get_owned_habit(habit_id, current_user, session)
    return habit


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
    if "goal_target" in updates:
        goal_target = updates["goal_target"]
        if goal_target is None or goal_target <= 0:
            raise HTTPException(status_code=400, detail="goal_target must be greater than zero")

    for field, value in updates.items():
        setattr(habit, field, value)
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    habit = _get_owned_habit(habit_id, current_user, session)
    session.delete(habit)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_owned_habit(habit_id: int, current_user: User, session: Session) -> Habit:
    statement = select(Habit).where(
        Habit.id == habit_id,
        Habit.user_id == current_user.id,
    )
    habit = session.exec(statement).first()
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit
