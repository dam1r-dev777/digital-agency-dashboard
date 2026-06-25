from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.models.project import Project
from app.models.payment import Payment
from app.schemas.project import ProjectRead

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
async def list_projects(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Project).options(
            selectinload(Project.payments).selectinload(Payment.act)
        )
    )
    projects = result.scalars().all()

    output = []
    for project in projects:
        acts_sent = sum(1 for p in project.payments if p.act and p.act.is_sent)
        acts_signed = sum(1 for p in project.payments if p.act and p.act.is_signed)
        total_amount = sum((p.amount for p in project.payments), start=0)

        output.append(ProjectRead(
            id=project.id,
            client_id=project.client_id,
            name=project.name,
            status=project.status,
            total_payments=len(project.payments),
            total_amount_paid=float(total_amount),
            acts_sent=acts_sent,
            acts_signed=acts_signed,
        ))
    return output
