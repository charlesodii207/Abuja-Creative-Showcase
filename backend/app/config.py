from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"
    resend_api_key: str
    email_from: str = "Abuja Creative Showcase <noreply@abujacreativeshowcase.com>"
    sponsor_inquiry_email: str = "info@abujacreativeshowcase.com"

    class Config:
        env_file = ".env"


settings = Settings()