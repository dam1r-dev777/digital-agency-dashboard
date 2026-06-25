import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.models.act import Act
from app.schemas.act import ActRead, ActStatusUpdate

router = APIRouter(prefix="/api/v1/acts", tags=["acts"])


@router.patch("/{act_id}/status", response_model=ActRead)
async def update_act_status(
    act_id: uuid.UUID,
    payload: ActStatusUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Act).where(Act.id == act_id).options(selectinload(Act.payment))
    )
    act = result.scalar_one_or_none()
    if not act:
        raise HTTPException(status_code=404, detail="Act not found")

    now = datetime.now(timezone.utc)

    if payload.is_sent is not None:
        act.is_sent = payload.is_sent
        act.sent_at = now if payload.is_sent else None
    if payload.is_signed is not None:
        act.is_signed = payload.is_signed
        act.signed_at = now if payload.is_signed else None
    if payload.manager_comment is not None:
        act.manager_comment = payload.manager_comment

    await session.commit()
    await session.refresh(act)
    await session.refresh(act, ["payment"])

    act._payment_date = act.payment.payment_date
    return ActRead.model_validate(act, from_attributes=True)
