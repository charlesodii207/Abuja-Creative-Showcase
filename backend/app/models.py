import enum
import uuid

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Enum, Text, Integer, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class RegistrantCategory(str, enum.Enum):
    attendee = "attendee"
    exhibitor = "exhibitor"
    press = "press"
    pitcher = "pitcher"
    investor = "investor"


class RegistrantStatus(str, enum.Enum):
    pending = "pending"              # Press / Investor: submitted, awaiting team review
    awaiting_payment = "awaiting_payment"  # Attendee / Exhibitor / Pitcher: registered, not yet paid
    approved = "approved"            # Press / Investor: reviewed and accepted
    rejected = "rejected"            # Press / Investor: reviewed and declined
    confirmed = "confirmed"          # Attendee / Exhibitor / Pitcher: payment received


class TicketType(str, enum.Enum):
    general = "general"
    vip = "vip"
    masterclass = "masterclass"  # top tier — includes everything VIP includes, plus more


class BoothSize(str, enum.Enum):
    small = "small"
    big = "big"


class ExhibitType(str, enum.Enum):
    booth = "booth"      # Buy a booth (small or big)
    auction = "auction"  # Auction a piece of art/fashion instead of buying a booth


# ---------------------------------------------------------------------------
# NEW: Admin auth
# ---------------------------------------------------------------------------

class AdminRole(str, enum.Enum):
    system_owner = "system_owner"
    super_admin = "super_admin"
    admin = "admin"


class Admin(Base):
    __tablename__ = "admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(AdminRole), nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("Admin", remote_side=[id])


# ---------------------------------------------------------------------------
# Existing registrant models (unchanged)
# ---------------------------------------------------------------------------

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

    attendee_detail = relationship("AttendeeDetail", back_populates="registrant", uselist=False)
    exhibitor_detail = relationship("ExhibitorDetail", back_populates="registrant", uselist=False)
    press_detail = relationship("PressDetail", back_populates="registrant", uselist=False)
    pitcher_detail = relationship("PitcherDetail", back_populates="registrant", uselist=False)
    investor_detail = relationship("InvestorDetail", back_populates="registrant", uselist=False)
    ticket = relationship("Ticket", back_populates="registrant", uselist=False)


class AttendeeDetail(Base):
    __tablename__ = "attendee_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    ticket_type = Column(Enum(TicketType), nullable=False, default=TicketType.general)
    wants_masterclass = Column(Boolean, default=False)  # deprecated — masterclass is now its own ticket_type tier
    is_paid = Column(Boolean, default=False)
    amount_kobo = Column(Integer, nullable=True)
    paystack_reference = Column(String, nullable=True, unique=True)
    pending_upgrade_ticket_type = Column(Enum(TicketType), nullable=True)  # set while an upgrade payment is in progress
    pending_upgrade_reference = Column(String, nullable=True, unique=True)  # Paystack reference for that upgrade payment

    registrant = relationship("Registrant", back_populates="attendee_detail")


class ExhibitorDetail(Base):
    __tablename__ = "exhibitor_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    company_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    what_bringing = Column(Text)
    portfolio_url = Column(String)
    goal = Column(String)
    exhibit_type = Column(Enum(ExhibitType), nullable=False)
    booth_size = Column(Enum(BoothSize), nullable=True)          # set only when exhibit_type == booth
    auction_item_description = Column(Text, nullable=True)       # set only when exhibit_type == auction
    auction_quantity = Column(Integer, nullable=True)             # set only when exhibit_type == auction
    is_paid = Column(Boolean, default=False)
    amount_kobo = Column(Integer, nullable=True)
    paystack_reference = Column(String, nullable=True, unique=True)

    registrant = relationship("Registrant", back_populates="exhibitor_detail")


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
    is_paid = Column(Boolean, default=False)
    amount_kobo = Column(Integer, nullable=True)
    paystack_reference = Column(String, nullable=True, unique=True)

    registrant = relationship("Registrant", back_populates="pitcher_detail")


class InvestorDetail(Base):
    __tablename__ = "investor_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    organization_name = Column(String, nullable=False)
    investment_interest = Column(Text)
    budget_range = Column(String)
    portfolio_url = Column(String)

    registrant = relationship("Registrant", back_populates="investor_detail")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(UUID(as_uuid=True), ForeignKey("registrants.id"), nullable=False, unique=True)
    qr_code = Column(String, unique=True)
    ticket_number = Column(String, unique=True)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))

    registrant = relationship("Registrant", back_populates="ticket")