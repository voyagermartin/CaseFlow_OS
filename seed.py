from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from datetime import date, datetime

def seed_data(db: Session):
    # Check if we already have users
    if db.query(models.User).first() is not None:
        print("Database already seeded.")
        return

    print("Seeding database...")

    # 1. Create Users
    martin = models.User(username="Martin", role="Admin", avatar_color="#3B82F6")
    op_ning = models.User(username="OP_Ning", role="OP", avatar_color="#10B981")
    sales_yang = models.User(username="Sales_Yang", role="Sales", avatar_color="#F59E0B")
    intern_a = models.User(username="Intern_A", role="Intern", avatar_color="#8B5CF6")

    db.add_all([martin, op_ning, sales_yang, intern_a])
    db.commit()
    db.refresh(martin)
    db.refresh(op_ning)
    db.refresh(sales_yang)
    db.refresh(intern_a)

    # 2. Create Demo Case
    case = models.Case(
        title="2026/09/15 馬航吉隆坡怡保專案 (IPH06MH260915A)",
        description="本專案為馬來西亞怡保主題出團專案，涵蓋機票、在地LOCAL、飯店預訂及簽證處理。",
        owner_id=martin.id
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # 3. Create Groups
    group_ticket = models.TaskGroup(case_id=case.id, name="票務與交通", order_index=0)
    group_local = models.TaskGroup(case_id=case.id, name="LOCAL 與 住宿", order_index=1)
    group_docs = models.TaskGroup(case_id=case.id, name="名單與證件", order_index=2)

    db.add_all([group_ticket, group_local, group_docs])
    db.commit()
    db.refresh(group_ticket)
    db.refresh(group_local)
    db.refresh(group_docs)

    # 4. Create Tasks
    # Group: 票務與交通
    task1 = models.TaskItem(
        group_id=group_ticket.id,
        title="馬航出發前32天確認付訂拿位",
        notes="確認收訂金並向航空公司拿位子。",
        start_date=date(2026, 8, 1),
        due_date=date(2026, 8, 14),
        is_completed=False
    )
    task1.visible_users = [martin, op_ning]

    task2 = models.TaskItem(
        group_id=group_ticket.id,
        title="馬航出發前5天完成全團開票",
        notes="核對名單無誤後進行最終開票作業。",
        start_date=date(2026, 9, 1),
        due_date=date(2026, 9, 10),
        is_completed=False
    )
    task2.visible_users = [martin, op_ning]

    # Group: LOCAL 與 住宿
    task3 = models.TaskItem(
        group_id=group_local.id,
        title="怡保風味餐廳與萬雅嵐溫泉預約確認",
        notes="聯絡當地Local代理確認特色餐食及溫泉渡假村預訂單。",
        start_date=date(2026, 8, 15),
        due_date=date(2026, 8, 30),
        is_completed=False
    )
    task3.visible_users = [martin, op_ning, sales_yang]

    # Group: 名單與證件
    task4 = models.TaskItem(
        group_id=group_docs.id,
        title="催收業務名單與護照影本",
        notes="收取全團旅客護照與證件影本以利開票及簽證作業。",
        start_date=date(2026, 8, 10),
        due_date=date(2026, 8, 25),
        is_completed=False
    )
    task4.visible_users = [op_ning, sales_yang]

    db.add_all([task1, task2, task3, task4])
    db.commit()
    db.refresh(task4)

    # 5. Add Comment
    comment = models.TaskComment(
        task_id=task4.id,
        user_id=op_ning.id,
        content="@Sales_Yang 請注意還缺2位台胞證與護照影本，謝謝！",
        created_at=datetime.utcnow()
    )
    db.add(comment)
    db.commit()

    print("Data seeded successfully!")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
