from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"
    resend_api_key: str
    email_from: str = "onboarding@resend.dev"
    sponsor_inquiry_email: str = "charlesodii207@gmail.com"

    class Config:
        env_file = ".env"


settings = Settings()