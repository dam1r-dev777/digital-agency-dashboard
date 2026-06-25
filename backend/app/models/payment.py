import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    payment_purpose: Mapped[str | None] = mapped_column(String(500))
    service_stage: Mapped[str | None] = mapped_column(String(255))

    project: Mapped["Project"] = relationship(back_populates="payments")
    client: Mapped["Client"] = relationship(back_populates="payments")
    act: Mapped["Act | None"] = relationship(back_populates="payment", uselist=False)
