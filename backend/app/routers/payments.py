import uuid
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.models.payment import Payment
from app.models.client import Client
from app.models.act import Act
from app.schemas.payment import PaymentListResponse, PaymentRead
from app.schemas.act import ActRead, ActStatus

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.get("", response_model=PaymentListResponse)
async def list_payments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    project_id: Optional[uuid.UUID] = None,
    status: Optional[ActStatus] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    base_q = select(Payment).options(selectinload(Payment.act), selectinload(Payment.client))

    filters = []
    if date_from:
        filters.append(Payment.payment_date >= date_from)
    if date_to:
        filters.append(Payment.payment_date <= date_to)
    if project_id:
        filters.append(Payment.project_id == project_id)
    if search:
        base_q = base_q.join(Client, Payment.client_id == Client.id)
        filters.append(or_(
            Payment.payment_purpose.ilike(f"%{search}%"),
            Client.name.ilike(f"%{search}%"),
        ))
    if filters:
        base_q = base_q.where(and_(*filters))

    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await session.execute(count_q)).scalar_one()

    paged_q = base_q.order_by(Payment.payment_date.desc()).offset((page - 1) * size).limit(size)
    rows = (await session.execute(paged_q)).scalars().all()

    items: list[PaymentRead] = []
    for payment in rows:
        act_data: Optional[ActRead] = None
        if payment.act:
            payment.act._payment_date = payment.payment_date
            act_data = ActRead.model_validate(payment.act, from_attributes=True)

        if status is not None:
            computed = act_data.status if act_data else ActStatus.NOT_SENT
            if computed != status:
                continue

        items.append(PaymentRead(
            id=payment.id,
            project_id=payment.project_id,
            client_id=payment.client_id,
            client_name=payment.client.name if payment.client else None,
            payment_date=payment.payment_date,
            amount=payment.amount,
            payment_purpose=payment.payment_purpose,
            service_stage=payment.service_stage,
            act=act_data,
        ))

    return PaymentListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=max(1, (total + size - 1) // size),
    )


@router.post("/{payment_id}/acts", response_model=ActRead)
async def create_act_for_payment(
    payment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Payment).where(Payment.id == payment_id).options(selectinload(Payment.act))
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.act:
        raise HTTPException(status_code=409, detail="Act already exists for this payment")

    act = Act(
        payment_id=payment_id,
        is_sent=True,
        sent_at=datetime.now(timezone.utc),
        is_signed=False,
    )
    session.add(act)
    await session.commit()
    await session.refresh(act)

    act._payment_date = payment.payment_date
    return ActRead.model_validate(act, from_attributes=True)
