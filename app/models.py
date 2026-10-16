from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel, UniqueConstraint


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    is_admin: bool = False


class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    goal_target: int = 30  # total check-ins the user wants to reach
    deadline: Optional[date] = None
    user_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CheckIn(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("habit_id", "day"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    habit_id: int = Field(foreign_key="habit.id", index=True)
    day: date
