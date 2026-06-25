from __future__ import annotations
import uuid
from datetime import datetime, timezone, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, model_validator


class ActStatus(str, Enum):
    NOT_SENT = "NOT_SENT"
    AWAITING_SIGNATURE = "AWAITING_SIGNATURE"
    CLOSED = "CLOSED"
    REQUIRES_ATTENTION = "REQUIRES_ATTENTION"


class ActRead(BaseModel):
    id: uuid.UUID
    payment_id: uuid.UUID
    is_sent: bool
    sent_at: Optional[datetime] = None
    is_signed: bool
    signed_at: Optional[datetime] = None
    manager_comment: Optional[str] = None
    status: ActStatus = ActStatus.NOT_SENT

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def compute_status(cls, data):
        if hasattr(data, "__dict__"):
            d = {
                "id": data.id,
                "payment_id": data.payment_id,
                "is_sent": data.is_sent,
                "sent_at": data.sent_at,
                "is_signed": data.is_signed,
                "signed_at": data.signed_at,
                "manager_comment": data.manager_comment,
                "_payment_date": getattr(data, "_payment_date", None),
            }
        else:
            d = dict(data)

        now = datetime.now(timezone.utc)
        is_sent = d.get("is_sent", False)
        is_signed = d.get("is_signed", False)
        sent_at = d.get("sent_at")
        payment_date = d.get("_payment_date")

        requires_attention = False

        if payment_date and not is_sent:
            days_since_payment = (now.date() - payment_date).days
            if days_since_payment > 14:
                requires_attention = True

        if is_sent and not is_signed and sent_at:
            if sent_at.tzinfo is None:
                sent_at = sent_at.replace(tzinfo=timezone.utc)
            days_since_sent = (now - sent_at).days
            if days_since_sent > 30:
                requires_attention = True

        if requires_attention:
            d["status"] = ActStatus.REQUIRES_ATTENTION
        elif is_sent and is_signed:
            d["status"] = ActStatus.CLOSED
        elif is_sent and not is_signed:
            d["status"] = ActStatus.AWAITING_SIGNATURE
        else:
            d["status"] = ActStatus.NOT_SENT

        return d


class ActStatusUpdate(BaseModel):
    is_sent: Optional[bool] = None
    is_signed: Optional[bool] = None
    manager_comment: Optional[str] = None
