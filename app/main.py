from contextlib import asynccontextmanager

from fastapi import FastAPI

from . import models  # noqa: F401  (registers the tables)
from .database import create_db_and_tables
from .routers import auth, habits


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Habit Tracker API", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(habits.router)


@app.get("/")
def root():
    return {"message": "Habit Tracker API is running"}
