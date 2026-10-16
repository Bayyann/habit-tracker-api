from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from .database import engine
from .models import User
from .security import verify_password_hash
from sqlmodel import Session, select


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = str(form.get("username", "")).strip()
        password = str(form.get("password", ""))

        with Session(engine) as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if user is None or not user.is_admin or not verify_password_hash(
                password, user.hashed_password
            ):
                return False

        request.session["admin_username"] = username
        return True

    async def authenticate(self, request: Request) -> bool | None:
        username = request.session.get("admin_username")
        if not isinstance(username, str):
            return False

        with Session(engine) as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if user is None or not user.is_admin:
                request.session.clear()
                return False
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True
