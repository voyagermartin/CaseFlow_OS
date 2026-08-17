from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Association table for task visibility (Many-to-Many between TaskItem and User)
task_visibility = Table(
    "task_visibility",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("task_items.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    avatar_color = Column(String, nullable=False, default="#3B82F6")

    # Relationships
    owned_cases = relationship("Case", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("TaskComment", back_populates="user", cascade="all, delete-orphan")
    visible_tasks = relationship(
        "TaskItem",
        secondary=task_visibility,
        back_populates="visible_users"
    )

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="owned_cases")
    groups = relationship("TaskGroup", back_populates="case", cascade="all, delete-orphan", order_by="TaskGroup.order_index")

class TaskGroup(Base):
    __tablename__ = "task_groups"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    order_index = Column(Integer, default=0)

    # Relationships
    case = relationship("Case", back_populates="groups")
    tasks = relationship("TaskItem", back_populates="group", cascade="all, delete-orphan")

class TaskItem(Base):
    __tablename__ = "task_items"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("task_groups.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    reminders_json = Column(Text, default="[]") # stored as json string

    # Relationships
    group = relationship("TaskGroup", back_populates="tasks")
    visible_users = relationship(
        "User",
        secondary=task_visibility,
        back_populates="visible_tasks"
    )
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan", order_by="TaskComment.created_at")

class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("task_items.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    task = relationship("TaskItem", back_populates="comments")
    user = relationship("User", back_populates="comments")
