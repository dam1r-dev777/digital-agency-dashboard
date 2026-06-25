"""Run with: python -m app.seed"""
import asyncio
import random
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from app.database import AsyncSessionLocal
from app.models.client import Client
from app.models.project import Project, ProjectStatus
from app.models.payment import Payment
from app.models.act import Act

CLIENTS_DATA = [
    {"name": "ООО Альфа Медиа", "inn": "7701234567", "ogrn": "1027700000001",
     "bank_account": "40702810900000000001", "contact_person": "Иванов И.И."},
    {"name": "ИП Петров Бизнес", "inn": "770298765432", "ogrn": "304770000000002",
     "bank_account": "40802810900000000002", "contact_person": "Петров П.П."},
    {"name": "ЗАО Гамма Техно", "inn": "7703456789", "ogrn": "1027700000003",
     "bank_account": "40702810900000000003", "contact_person": "Сидорова А.В."},
    {"name": "ООО Дельта Диджитал", "inn": "7704567890", "ogrn": "1027700000004",
     "bank_account": "40702810900000000004", "contact_person": "Козлов В.С."},
]

PROJECT_NAMES = [
    "SEO продвижение", "Разработка сайта", "SMM ведение",
    "Таргетированная реклама", "Email-маркетинг", "Контент-маркетинг",
]

PURPOSES = [
    "Оплата услуг по договору", "Аванс за разработку",
    "Ежемесячный абонемент", "Оплата этапа проекта",
]


async def seed():
    async with AsyncSessionLocal() as session:
        clients = []
        for cd in CLIENTS_DATA:
            c = Client(**cd)
            session.add(c)
            clients.append(c)
        await session.flush()

        projects = []
        for client in clients:
            chosen = random.sample(PROJECT_NAMES, k=random.randint(2, 3))
            for pname in chosen:
                status = random.choice(list(ProjectStatus))
                p = Project(client_id=client.id, name=pname, status=status)
                session.add(p)
                projects.append(p)
        await session.flush()

        today = date.today()
        for project in projects:
            for _ in range(random.randint(3, 7)):
                days_ago = random.randint(0, 60)
                pdate = today - timedelta(days=days_ago)
                amount = Decimal(str(random.randint(50, 500) * 1000))

                payment = Payment(
                    project_id=project.id,
                    client_id=project.client_id,
                    payment_date=pdate,
                    amount=amount,
                    payment_purpose=random.choice(PURPOSES),
                    service_stage=random.choice(["Этап 1", "Этап 2", "Финальный этап"]),
                )
                session.add(payment)
                await session.flush()

                if random.random() < 0.85:
                    is_sent = random.random() < 0.7
                    sent_at = None
                    if is_sent:
                        sent_days_ago = random.randint(1, 45)
                        sent_at = datetime.now(timezone.utc) - timedelta(days=sent_days_ago)

                    is_signed = (random.random() < 0.55) if is_sent else False
                    signed_at = None
                    if is_signed:
                        signed_at = sent_at + timedelta(days=random.randint(1, 15))

                    act = Act(
                        payment_id=payment.id,
                        is_sent=is_sent,
                        sent_at=sent_at,
                        is_signed=is_signed,
                        signed_at=signed_at,
                    )
                    session.add(act)

        await session.commit()
        print("Seed complete — database populated with test data.")


if __name__ == "__main__":
    asyncio.run(seed())
