from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from sqladmin import Admin, ModelView

from . import models as _models  # noqa: F401  # registers the tables
from .admin_auth import AdminAuth
from .database import create_db_and_tables, engine
from .models import CheckIn, Habit, User
from .routers import auth, habits


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Habit Tracker API", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(habits.router)

session_secret = os.getenv("SESSION_SECRET_KEY")
if not session_secret and os.getenv("APP_ENV", "development") != "development":
    raise RuntimeError("SESSION_SECRET_KEY must be set outside development")
session_secret = session_secret or "local-dev-session-key-change-before-deployment"
class UserAdmin(ModelView, model=User):
    name = "User"
    name_plural = "Users"
    column_list = [User.id, User.username, User.is_admin]
    column_searchable_list = [User.username]
    column_sortable_list = [User.id, User.username, User.is_admin]
    column_details_exclude_list = [User.hashed_password]
    can_create = False
    can_edit = False
    can_delete = False
    can_export = False


class HabitAdmin(ModelView, model=Habit):
    name = "Habit"
    name_plural = "Habits"
    column_list = [Habit.id, Habit.name, Habit.user_id, Habit.goal_target, Habit.deadline]
    column_searchable_list = [Habit.name]
    column_sortable_list = [Habit.id, Habit.name, Habit.goal_target, Habit.deadline]
    form_columns = [Habit.name, Habit.description, Habit.goal_target, Habit.deadline, Habit.user_id]
    can_create = False
    can_edit = False
    can_delete = False
    can_export = False


class CheckInAdmin(ModelView, model=CheckIn):
    name = "Check-in"
    name_plural = "Check-ins"
    column_list = [CheckIn.id, CheckIn.habit_id, CheckIn.day]
    column_sortable_list = [CheckIn.id, CheckIn.habit_id, CheckIn.day]
    can_create = False
    can_edit = False
    can_delete = False
    can_export = False


admin = Admin(
    app,
    engine,
    title="Daywell Administration",
    base_url="/admin",
    middlewares=[
        Middleware(
            SessionMiddleware,
            secret_key=session_secret,
            same_site="lax",
            https_only=os.getenv("APP_ENV", "development") != "development",
            max_age=28_800,
        )
    ],
    authentication_backend=AdminAuth(secret_key=session_secret),
)
admin.add_view(UserAdmin)
admin.add_view(HabitAdmin)
admin.add_view(CheckInAdmin)

@app.get("/")
def root():
    return {"message": "Habit Tracker API is running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)