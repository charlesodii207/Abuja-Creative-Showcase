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

    # Kora (Korapay) payments. The key decides test or live mode:
    # sk_test_... for testing, sk_live_... once ACS is live.
    kora_secret_key: str = ""
    kora_public_key: str = ""
    # Present in .env / Render. The Checkout Redirect flow doesn't use it,
    # but it must be declared here or the app refuses to read .env.
    kora_encryption_key: str = ""
    # Full public URL of the backend's /payments/webhook route, e.g.
    # https://your-backend-host/payments/webhook. Optional: if blank, payments
    # are only confirmed when the customer's browser returns to the site.
    kora_webhook_url: str = ""

    # Paystack is being replaced by Kora. These now default to empty so the
    # app still starts once the Paystack keys are removed from .env.
    paystack_secret_key: str = ""
    paystack_public_key: str = ""

    # ------------------------------------------------------------------
    # Manual (bank transfer) payments. Set these in .env and on Render
    # (BANK_NAME, BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER). While any of the
    # three is blank, the bank transfer option tells people it isn't
    # available instead of showing empty details.
    # ------------------------------------------------------------------
    bank_name: str = ""
    bank_account_name: str = ""
    bank_account_number: str = ""
    # Who is emailed when someone taps "I've paid".
    manual_payment_notify_email: str = "info@africacreativeshowcase.com"

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