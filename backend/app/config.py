from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"
    resend_api_key: str

    # Automated/system emails
    email_from: str = (
        "Afriqa Creative Showcase <noreply@africacreativeshowcase.com>"
    )

    # Contact/sponsor inquiry notifications
    sponsor_inquiry_email: str = "info@africacreativeshowcase.com"

    # Admin notification email
    admin_email: str = "admin@africacreativeshowcase.com"

    # Emails sent as replies from the admin dashboard
    reply_email: str = (
        "Afriqa Creative Showcase <info@africacreativeshowcase.com>"
    )

    paystack_secret_key: str
    paystack_public_key: str

    frontend_url: str = "https://africacreativeshowcase.com"

    jwt_secret: str

    # ------------------------------------------------------------------
    # Zoho mailbox sync (IMAP). Off unless MAIL_SYNC_ENABLED=true.
    # ------------------------------------------------------------------
    mail_sync_enabled: bool = False
    mail_sync_interval_seconds: int = 60
    # 0 = on first run, start from "now" and don't import old mail.
    # N > 0 = on first run, also import the last N days.
    mail_sync_backfill_days: int = 0
    zoho_imap_host: str = "imap.zoho.com"   # imap.zoho.eu / imap.zoho.in on other data centers
    zoho_imap_port: int = 993

    # One app password per mailbox. Blank = that mailbox isn't synced.
    zoho_password_admin: str = ""
    zoho_password_info: str = ""
    zoho_password_director: str = ""
    zoho_password_convener: str = ""
    zoho_password_bookings: str = ""
    zoho_password_marketing: str = ""

    def zoho_password(self, mailbox: str) -> str:
        return getattr(self, f"zoho_password_{mailbox}", "")

    class Config:
        env_file = ".env"


settings = Settings()