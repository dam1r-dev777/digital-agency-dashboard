from __future__ import annotations
import uuid
from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from .act import ActRead


class PaymentRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    client_id: uuid.UUID
    client_name: Optional[str] = None
    payment_date: date
    amount: Decimal
    payment_purpose: Optional[str] = None
    service_stage: Optional[str] = None
    act: Optional[ActRead] = None

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    items: list[PaymentRead]
    total: int
    page: int
    size: int
    pages: int
