import enum
import uuid

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Enum, Text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class RegistrantCategory(str, enum.Enum):
    visitor = "visitor"
    exhibitor = "exhibitor"
    speaker = "speaker"
    press = "press"
    pitcher = "pitcher"


class RegistrantStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    confirmed = "confirmed"


class TicketType(str, enum.Enum):
    general = "general"
    vip = "vip"


class Registrant(Base):
    __tablename__ = "registrants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False, index=True)
    category = Column(Enum(RegistrantCategory), nullable=False)
    reference_number = Column(String, unique=True, nullable=False, index=True)
    status = Column(Enum(RegistrantStatus), nullable=False, default=RegistrantStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visitor_detail = relationship("VisitorDetail", back_populates="registrant", uselist=False)
    exhibitor_detail = relationship("ExhibitorDetail", back_populates="registrant", uselist=False)
    speaker_detail = relationship("SpeakerDetail", back_populates="registrant", uselist=False)
    press_detail = relationship("PressDetail", back_populates="registrant", uselist=False)
    pitcher_detail = relationship("PitcherDetail", back_populates="registrant", uselist=False)
    ticket = relationship("Ticket", back_populates="registrant", uselist=False)


class VisitorDetail(Base):
    __tablename__ = "visitor_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    ticket_type = Column(Enum(TicketType), nullable=False, default=TicketType.general)
    wants_masterclass = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)

    registrant = relationship("Registrant", back_populates="visitor_detail")


class ExhibitorDetail(Base):
    __tablename__ = "exhibitor_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    company_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    what_bringing = Column(Text)
    portfolio_url = Column(String)
    goal = Column(String)
    is_paid = Column(Boolean, default=False)

    registrant = relationship("Registrant", back_populates="exhibitor_detail")


class SpeakerDetail(Base):
    __tablename__ = "speaker_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    topic = Column(String, nullable=False)
    bio = Column(Text)
    headshot_url = Column(String)

    registrant = relationship("Registrant", back_populates="speaker_detail")


class PressDetail(Base):
    __tablename__ = "press_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    outlet_name = Column(String, nullable=False)
    proof_type = Column(String)
    proof_url = Column(String)

    registrant = relationship("Registrant", back_populates="press_detail")


class PitcherDetail(Base):
    __tablename__ = "pitcher_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    project_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    pitch_summary = Column(Text)
    work_sample_url = Column(String)

    registrant = relationship("Registrant", back_populates="pitcher_detail")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    qr_code = Column(String, unique=True)
    ticket_number = Column(String, unique=True)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))

    registrant = relationship("Registrant", back_populates="ticket")