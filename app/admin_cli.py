import argparse
from getpass import getpass

from sqlmodel import Session, select

from .database import create_db_and_tables, engine, set_admin_status
from .models import User
from .security import hash_password


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage Daywell administrator accounts.")
    parser.add_argument("username", nargs="?", help="Username of the account to manage")
    parser.add_argument("--revoke", action="store_true", help="Revoke administrator access instead")
    parser.add_argument("--create-admin", action="store_true", help="Create or reset a separate administrator login")
    args = parser.parse_args()

    if args.revoke and args.create_admin:
        parser.error("--revoke and --create-admin cannot be used together")
    if not args.username:
        parser.error("provide a username")

    create_db_and_tables()
    if args.create_admin:
        password = getpass("New admin password: ")
        confirmation = getpass("Confirm password: ")
        if len(password) < 12:
            parser.error("admin password must be at least 12 characters")
        if password != confirmation:
            parser.error("passwords did not match")
        with Session(engine) as session:
            user = session.exec(select(User).where(User.username == args.username)).first()
            if user is None:
                user = User(username=args.username, hashed_password=hash_password(password), is_admin=True)
            else:
                user.hashed_password = hash_password(password)
                user.is_admin = True
            session.add(user)
            session.commit()
        print(f"Dedicated admin login created or reset for {args.username!r}.")
        return

    is_admin = not args.revoke
    if not set_admin_status(args.username, is_admin):
        parser.error(f"No account exists for username {args.username!r}; register it first.")
    action = "revoked from" if args.revoke else "granted to"
    print(f"Administrator access {action} {args.username!r}.")


if __name__ == "__main__":
    main()
