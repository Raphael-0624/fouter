from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


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
    avatar_url = Column(Text)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department")
    keys = relationship("UserKey", back_populates="user", cascade="all, delete-orphan")


class UserKey(Base):
    __tablename__ = "user_keys"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    key_hash = Column(String(128), unique=True, nullable=False)
    name = Column(String(128))
    rate_limit_rpm = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="keys")
