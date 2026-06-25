import uuid
import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ProjectStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(SAEnum(ProjectStatus), nullable=False, default=ProjectStatus.active)

    client: Mapped["Client"] = relationship(back_populates="projects")
    payments: Mapped[list["Payment"]] = relationship(back_populates="project")
