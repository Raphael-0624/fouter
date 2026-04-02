from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://fouter:fouter123@localhost/fouter"
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = "your-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    feishu_app_id: str = ""
    feishu_app_secret: str = ""
    log_level: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
