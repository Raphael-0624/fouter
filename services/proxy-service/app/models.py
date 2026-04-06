from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Provider(Base):
    __tablename__ = "providers"
    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    type = Column(String(32), nullable=False)
    base_url = Column(Text, nullable=False)
    api_key_encrypted = Column(Text, nullable=False)
    rate_limit_qps = Column(Integer, default=5)
    rate_limit_rpm = Column(Integer, default=300)
    balance = Column(DECIMAL(20, 4))
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    model_id = Column(String(128), nullable=False)
    display_name = Column(String(128), nullable=False)
    description = Column(Text)
    context_window = Column(Integer)
    input_price_per_1k = Column(DECIMAL(10, 6))
    output_price_per_1k = Column(DECIMAL(10, 6))
    capabilities = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserKey(Base):
    __tablename__ = "user_keys"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    key_hash = Column(String(128), nullable=False)
    name = Column(String(128))
    rate_limit_rpm = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
