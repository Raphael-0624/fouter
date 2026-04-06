try:
    from pydantic import BaseSettings
except ImportError:
    from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://fouter:fouter123@localhost/fouter"
    redis_url: str = "redis://localhost:6379"
    rate_limit_service_url: str = "http://rate-limit-service:8000"
    log_level: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
