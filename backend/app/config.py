from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"
    resend_api_key: str

    # Automated/system emails
    email_from: str = (
        "Africa Creative Showcase <noreply@africacreativeshowcase.com>"
    )

    # Contact/sponsor inquiry notifications
    sponsor_inquiry_email: str = "info@africacreativeshowcase.com"

    # Admin notification email
    admin_email: str = "admin@africacreativeshowcase.com"

    # Emails sent as replies from the admin dashboard
    reply_email: str = (
        "Africa Creative Showcase <info@africacreativeshowcase.com>"
    )

    paystack_secret_key: str
    paystack_public_key: str

    frontend_url: str = "https://africacreativeshowcase.com"

    jwt_secret: str

    class Config:
        env_file = ".env"


settings = Settings()