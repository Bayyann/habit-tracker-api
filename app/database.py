from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./habits.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # create_all does not add columns to an existing SQLite database.
    if "is_admin" not in {column["name"] for column in inspect(engine).get_columns("user")}:
        with engine.begin() as connection:
            connection.execute(
                text('ALTER TABLE "user" ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0')
            )


def set_admin_status(username: str, is_admin: bool) -> bool:
    """Set a user's admin status; return False when the username doesn't exist."""
    with engine.begin() as connection:
        result = connection.execute(
            text('UPDATE "user" SET is_admin = :is_admin WHERE username = :username'),
            {"is_admin": is_admin, "username": username},
        )
        return result.rowcount > 0


def get_session():
    with Session(engine) as session:
        yield session
