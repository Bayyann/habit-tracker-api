from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    goal_target: int = 30
    deadline: Optional[date] = None


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    goal_target: Optional[int] = None
    deadline: Optional[date] = None


class HabitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    goal_target: int
    deadline: Optional[date]
    user_id: int
    created_at: datetime


class CheckInRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    habit_id: int
    day: date


class CheckInResult(BaseModel):
    check_in: CheckInRead
    current_streak: int
