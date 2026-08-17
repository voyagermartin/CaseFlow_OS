from sqlalchemy.orm import Session
import models
import schemas
from typing import List

def get_user_cases(db: Session, user_id: int):
    cases = db.query(models.Case).all()
    result = []
    for case in cases:
        is_owner = (case.owner_id == user_id)
        
        has_visible_task = False
        filtered_groups = []
        for g in case.groups:
            tasks_visible_to_user = []
            for t in g.tasks:
                if is_owner or any(u.id == user_id for u in t.visible_users):
                    tasks_visible_to_user.append(t)
                    has_visible_task = True
            
            filtered_groups.append({
                "id": g.id,
                "case_id": g.case_id,
                "name": g.name,
                "order_index": g.order_index,
                "tasks": tasks_visible_to_user
            })
            
        if is_owner or has_visible_task:
            result.append({
                "id": case.id,
                "title": case.title,
                "description": case.description,
                "owner_id": case.owner_id,
                "created_at": case.created_at,
                "owner": case.owner,
                "groups": filtered_groups
            })
    return result

def create_case(db: Session, case_in: schemas.CaseCreate):
    db_case = models.Case(
        title=case_in.title,
        description=case_in.description,
        owner_id=case_in.owner_id
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
    # Create default groups if specified
    for idx, group_name in enumerate(case_in.groups):
        db_group = models.TaskGroup(
            case_id=db_case.id,
            name=group_name,
            order_index=idx
        )
        db.add(db_group)
    db.commit()
    db.refresh(db_case)
    return db_case

def get_users(db: Session):
    return db.query(models.User).all()

def toggle_task_completion(db: Session, task_id: int):
    task = db.query(models.TaskItem).filter(models.TaskItem.id == task_id).first()
    if task:
        task.is_completed = not task.is_completed
        db.commit()
        db.refresh(task)
    return task

def create_task(db: Session, group_id: int, task_in: schemas.TaskItemCreate):
    db_task = models.TaskItem(
        group_id=group_id,
        title=task_in.title,
        notes=task_in.notes,
        start_date=task_in.start_date,
        due_date=task_in.due_date,
        is_completed=task_in.is_completed,
        reminders_json=task_in.reminders_json
    )
    
    # Assign visible users
    if task_in.visible_user_ids:
        users = db.query(models.User).filter(models.User.id.in_(task_in.visible_user_ids)).all()
        db_task.visible_users = users
        
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_in: schemas.TaskItemUpdate):
    db_task = db.query(models.TaskItem).filter(models.TaskItem.id == task_id).first()
    if not db_task:
        return None
        
    update_data = task_in.model_dump(exclude_unset=True)
    
    # Handle visible users update separately
    if "visible_user_ids" in update_data:
        user_ids = update_data.pop("visible_user_ids")
        if user_ids is not None:
            users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
            db_task.visible_users = users
            
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

def add_comment(db: Session, task_id: int, comment_in: schemas.TaskCommentCreate):
    db_comment = models.TaskComment(
        task_id=task_id,
        user_id=comment_in.user_id,
        content=comment_in.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment
