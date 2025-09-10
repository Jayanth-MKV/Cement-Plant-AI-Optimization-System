from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True

    # Supabase Settings
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    # Database Settings
    database_url: Optional[str] = None

    # Scheduler Settings
    scheduler_timezone: str = "UTC"

    class Config:
        env_file = ".env"


settings = Settings()
