from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    log_level: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
