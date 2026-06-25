from decimal import Decimal
from pydantic import BaseModel


class StatusBreakdown(BaseModel):
    NOT_SENT: int = 0
    AWAITING_SIGNATURE: int = 0
    CLOSED: int = 0
    REQUIRES_ATTENTION: int = 0


class DashboardSummary(BaseModel):
    total_payments: int
    total_amount: Decimal
    amount_by_status: dict[str, Decimal]
    count_by_status: StatusBreakdown
    requires_attention_count: int
