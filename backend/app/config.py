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
    # Zoho mailbox sync (Zoho Mail API). Off unless MAIL_SYNC_ENABLED=true.
    # ------------------------------------------------------------------
    mail_sync_enabled: bool = False
    mail_sync_interval_seconds: int = 60
    # 0 = on first run, start from "now" and don't import old mail.
    # N > 0 = on first run, also import the last N days.
    mail_sync_backfill_days: int = 0
    # Senders the sync should never import (exact address, or a whole domain).
    mail_sync_ignore_senders: str = "noreply@zohoaccounts.com,zohocorp.com,zohomail.com,zoho.com"

    # One Zoho "Self Client" is shared by every mailbox.
    zoho_client_id: str = ""
    zoho_client_secret: str = ""
    zoho_accounts_host: str = "https://accounts.zoho.com"   # .eu / .in / .com.au elsewhere
    zoho_mail_host: str = "https://mail.zoho.com"

    # Per mailbox: refresh token + Zoho account id. Blank = not synced.
    zoho_refresh_token_admin: str = ""
    zoho_account_id_admin: str = ""
    zoho_refresh_token_info: str = ""
    zoho_account_id_info: str = ""
    zoho_refresh_token_director: str = ""
    zoho_account_id_director: str = ""
    zoho_refresh_token_convener: str = ""
    zoho_account_id_convener: str = ""
    zoho_refresh_token_bookings: str = ""
    zoho_account_id_bookings: str = ""
    zoho_refresh_token_marketing: str = ""
    zoho_account_id_marketing: str = ""

    def zoho_refresh_token(self, mailbox: str) -> str:
        return getattr(self, f"zoho_refresh_token_{mailbox}", "")

    def zoho_account_id(self, mailbox: str) -> str:
        return getattr(self, f"zoho_account_id_{mailbox}", "")

    class Config:
        env_file = ".env"


settings = Settings()