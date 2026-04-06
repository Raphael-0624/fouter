try:
    from pydantic import BaseSettings
except ImportError:
    from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    database_url: str = "postgresql://fouter:fouter123@localhost/fouter"
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = ""  # Required - must be set via environment variable
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    feishu_app_id: str = ""
    feishu_app_secret: str = ""
    log_level: str = "info"

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate required secrets
        if not self.jwt_secret:
            # Generate a warning but don't fail for development
            import warnings
            warnings.warn("JWT_SECRET not set - using temporary key for development only")
            self.jwt_secret = os.urandom(32).hex()


settings = Settings()
