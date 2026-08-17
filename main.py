from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os

from database import engine, get_db, Base
import models
import schemas
import crud
from seed import seed_data

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
db = next(get_db())
try:
    seed_data(db)
finally:
    db.close()

app = FastAPI(title="CaseFlow OS API")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def read_dashboard(request: Request, db: Session = Depends(get_db)):
    users = crud.get_users(db)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"users": users}
    )

# --- Users API ---
@app.get("/api/users", response_model=list[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

# --- Cases API ---
@app.get("/api/cases")
def get_cases(user_id: int = Query(...), db: Session = Depends(get_db)):
    return crud.get_user_cases(db, user_id=user_id)

@app.post("/api/cases", response_model=schemas.Case)
def create_new_case(case_in: schemas.CaseCreate, db: Session = Depends(get_db)):
    return crud.create_case(db, case_in=case_in)

# --- Tasks API ---
@app.post("/api/tasks/{task_id}/toggle")
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.toggle_task_completion(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "is_completed": task.is_completed}

@app.post("/api/groups/{group_id}/tasks", response_model=schemas.TaskItem)
def create_group_task(group_id: int, task_in: schemas.TaskItemCreate, db: Session = Depends(get_db)):
    return crud.create_task(db, group_id=group_id, task_in=task_in)

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskItem)
def update_task_item(task_id: int, task_in: schemas.TaskItemUpdate, db: Session = Depends(get_db)):
    task = crud.update_task(db, task_id=task_id, task_in=task_in)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks/{task_id}/comment", response_model=schemas.TaskComment)
def add_task_comment(task_id: int, comment_in: schemas.TaskCommentCreate, db: Session = Depends(get_db)):
    return crud.add_comment(db, task_id=task_id, comment_in=comment_in)
