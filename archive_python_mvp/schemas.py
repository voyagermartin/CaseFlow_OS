from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str
    avatar_color: str = "#3B82F6"

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Comment Schemas ---
class TaskCommentBase(BaseModel):
    content: str

class TaskCommentCreate(TaskCommentBase):
    user_id: int

class TaskComment(TaskCommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True

# --- TaskItem Schemas ---
class TaskItemBase(BaseModel):
    title: str
    notes: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    is_completed: bool = False
    reminders_json: str = "[]"

class TaskItemCreate(TaskItemBase):
    visible_user_ids: List[int] = []

class TaskItemUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    is_completed: Optional[bool] = None
    visible_user_ids: Optional[List[int]] = None
    reminders_json: Optional[str] = None

class TaskItem(TaskItemBase):
    id: int
    group_id: int
    visible_users: List[User] = []
    comments: List[TaskComment] = []

    class Config:
        from_attributes = True

# --- TaskGroup Schemas ---
class TaskGroupBase(BaseModel):
    name: str
    order_index: int = 0

class TaskGroupCreate(TaskGroupBase):
    pass

class TaskGroup(TaskGroupBase):
    id: int
    case_id: int
    tasks: List[TaskItem] = []

    class Config:
        from_attributes = True

# --- Case Schemas ---
class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None

class CaseCreate(CaseBase):
    owner_id: int
    groups: List[str] = [] # Group names to create by default

class Case(CaseBase):
    id: int
    owner_id: int
    created_at: datetime
    owner: User
    groups: List[TaskGroup] = []

    class Config:
        from_attributes = True
