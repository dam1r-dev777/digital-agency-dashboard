from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.models.payment import Payment
from app.schemas.dashboard import DashboardSummary, StatusBreakdown
from app.schemas.act import ActRead, ActStatus

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Payment).options(selectinload(Payment.act))
    )
    payments = result.scalars().all()

    total_amount = Decimal("0")
    count_by_status: dict[ActStatus, int] = {s: 0 for s in ActStatus}
    amount_by_status: dict[ActStatus, Decimal] = {s: Decimal("0") for s in ActStatus}

    for payment in payments:
        total_amount += payment.amount
        if payment.act:
            payment.act._payment_date = payment.payment_date
            act_schema = ActRead.model_validate(payment.act, from_attributes=True)
            s = act_schema.status
        else:
            s = ActStatus.NOT_SENT

        count_by_status[s] += 1
        amount_by_status[s] += payment.amount

    return DashboardSummary(
        total_payments=len(payments),
        total_amount=total_amount,
        amount_by_status={k.value: v for k, v in amount_by_status.items()},
        count_by_status=StatusBreakdown(
            NOT_SENT=count_by_status[ActStatus.NOT_SENT],
            AWAITING_SIGNATURE=count_by_status[ActStatus.AWAITING_SIGNATURE],
            CLOSED=count_by_status[ActStatus.CLOSED],
            REQUIRES_ATTENTION=count_by_status[ActStatus.REQUIRES_ATTENTION],
        ),
        requires_attention_count=count_by_status[ActStatus.REQUIRES_ATTENTION],
    )
