import uuid
from pydantic import BaseModel
from app.models.project import ProjectStatus


class ProjectRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    status: ProjectStatus
    total_payments: int = 0
    total_amount_paid: float = 0.0
    acts_sent: int = 0
    acts_signed: int = 0

    model_config = {"from_attributes": True}
