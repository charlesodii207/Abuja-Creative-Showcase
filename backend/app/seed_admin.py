"""
One-time script to create the first System Owner admin account.

Run this ONCE, after running your Alembic migration that adds the `admins` table.

Usage:
    python -m app.seed_admin

You'll be prompted to type the temp password directly into the terminal
(it won't be saved anywhere in code or git).
"""

import getpass

from app.database import SessionLocal
from app import models
from app.auth import hash_password


def seed_owner():
    db = SessionLocal()
    try:
        existing = db.query(models.Admin).filter(models.Admin.username == "Owner").first()
        if existing:
            print("An admin with username 'Owner' already exists. Nothing to do.")
            return

        temp_password = getpass.getpass("Set a temporary password for the System Owner account: ")
        confirm = getpass.getpass("Confirm password: ")

        if temp_password != confirm:
            print("Passwords did not match. Aborting.")
            return

        if len(temp_password) < 8:
            print("Password must be at least 8 characters. Aborting.")
            return

        owner = models.Admin(
            full_name="Abuja Showcase",
            username="Owner",
            password_hash=hash_password(temp_password),
            role=models.AdminRole.system_owner,
            must_change_password=True,
            created_by=None,
        )
        db.add(owner)
        db.commit()

        print("System Owner account created successfully.")
        print("Username: Owner")
        print("You'll be required to change this password on first login.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_owner()