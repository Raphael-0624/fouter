from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON, BigInteger
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True)
    feishu_dept_id = Column(String(64), unique=True)
    name = Column(String(128), nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    feishu_user_id = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    email = Column(String(256))
    department_id = Column(Integer, ForeignKey("departments.id"))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)


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


class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    model_id = Column(String(128), nullable=False)
    display_name = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)


class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(BigInteger, primary_key=True)
    time = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    provider_id = Column(Integer, ForeignKey("providers.id"))
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost = Column(DECIMAL(20, 8), default=0)
    latency_ms = Column(Integer)
    has_sensitive_data = Column(Boolean, default=False)
