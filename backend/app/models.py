import enum
import uuid

from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, ForeignKey, Enum, Text, Integer, func
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
    pending = "pending"
    awaiting_payment = "awaiting_payment"
    approved = "approved"
    rejected = "rejected"
    confirmed = "confirmed"


class TicketType(str, enum.Enum):
    general = "general"
    vip = "vip"
    masterclass = "masterclass"


class BoothSize(str, enum.Enum):
    small = "small"
    big = "big"


class ExhibitType(str, enum.Enum):
    booth = "booth"
    auction = "auction"


# ---------------------------------------------------------------------------
# Admin auth
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
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("Admin", remote_side=[id])

    # Messaging: replies sent by this admin.
    contact_messages = relationship(
        "ContactMessage",
        foreign_keys="ContactMessage.admin_id",
        back_populates="admin",
    )


class AdminLog(Base):
    """
    Audit trail. Records both manual admin actions (approve, reject, edit,
    mark-paid, resend-email, create/deactivate/delete admin, login) and
    system-triggered events (e.g. automatic status-change emails), so
    admin_id is nullable and admin_name falls back to "System" when there's
    no human actor. admin_id also goes NULL if the acting admin is later
    deleted; admin_name is a snapshot and stays intact either way.
    """

    __tablename__ = "admin_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(
        UUID(as_uuid=True),
        ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True,
    )
    admin_name = Column(String, nullable=True)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_reference = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Contact messaging
# ---------------------------------------------------------------------------

class ContactThread(Base):
    __tablename__ = "contact_threads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    sender_name = Column(String, nullable=False)
    sender_email = Column(String, nullable=False, index=True)
    sender_phone = Column(String, nullable=True)

    subject = Column(String, nullable=False)

    # Admin-controlled conversation state.
    status = Column(String, nullable=False, default="open")

    # Automatically becomes True once ACS sends a reply.
    is_replied = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    messages = relationship(
        "ContactMessage",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="ContactMessage.created_at",
    )


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    thread_id = Column(
        UUID(as_uuid=True),
        ForeignKey("contact_threads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # "visitor" or "admin"
    sender_type = Column(String, nullable=False)

    sender_name = Column(String, nullable=False)
    sender_email = Column(String, nullable=False)

    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)

    # Only populated when sender_type == "admin".
    admin_id = Column(
        UUID(as_uuid=True),
        ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Read/unread belongs to individual messages.
    is_read = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    thread = relationship(
        "ContactThread",
        back_populates="messages",
    )

    admin = relationship(
        "Admin",
        foreign_keys=[admin_id],
        back_populates="contact_messages",
    )


# ---------------------------------------------------------------------------
# Registrants
# ---------------------------------------------------------------------------

class Registrant(Base):
    __tablename__ = "registrants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False, index=True)
    category = Column(Enum(RegistrantCategory), nullable=False)
    reference_number = Column(String, unique=True, nullable=False, index=True)
    status = Column(
        Enum(RegistrantStatus),
        nullable=False,
        default=RegistrantStatus.pending,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attendee_detail = relationship(
        "AttendeeDetail",
        back_populates="registrant",
        uselist=False,
    )
    exhibitor_detail = relationship(
        "ExhibitorDetail",
        back_populates="registrant",
        uselist=False,
    )
    press_detail = relationship(
        "PressDetail",
        back_populates="registrant",
        uselist=False,
    )
    pitcher_detail = relationship(
        "PitcherDetail",
        back_populates="registrant",
        uselist=False,
    )
    investor_detail = relationship(
        "InvestorDetail",
        back_populates="registrant",
        uselist=False,
    )
    ticket = relationship(
        "Ticket",
        back_populates="registrant",
        uselist=False,
    )


class AttendeeDetail(Base):
    __tablename__ = "attendee_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registrants.id"),
        nullable=False,
        unique=True,
    )
    ticket_type = Column(
        Enum(TicketType),
        nullable=False,
        default=TicketType.general,
    )
    wants_masterclass = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    amount_kobo = Column(Integer, nullable=True)
    paystack_reference = Column(String, nullable=True, unique=True)
    pending_upgrade_ticket_type = Column(Enum(TicketType), nullable=True)
    pending_upgrade_reference = Column(String, nullable=True, unique=True)
    pending_payment_reference = Column(String, nullable=True, unique=True)

    registrant = relationship(
        "Registrant",
        back_populates="attendee_detail",
    )


class ExhibitorDetail(Base):
    __tablename__ = "exhibitor_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registrants.id"),
        nullable=False,
        unique=True,
    )
    company_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    what_bringing = Column(Text)
    portfolio_url = Column(String)
    goal = Column(String)
    exhibit_type = Column(Enum(ExhibitType), nullable=False)
    booth_size = Column(Enum(BoothSize), nullable=True)
    auction_item_description = Column(Text, nullable=True)
    auction_quantity = Column(Integer, nullable=True)
    is_paid = Column(Boolean, default=False)
    amount_kobo = Column(Integer, nullable=True)
    paystack_reference = Column(String, nullable=True, unique=True)
    pending_payment_reference = Column(String, nullable=True, unique=True)

    registrant = relationship(
        "Registrant",
        back_populates="exhibitor_detail",
    )


class PressDetail(Base):
    __tablename__ = "press_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registrants.id"),
        nullable=False,
        unique=True,
    )
    outlet_name = Column(String, nullable=False)
    proof_type = Column(String)
    proof_url = Column(String)

    registrant = relationship(
        "Registrant",
        back_populates="press_detail",
    )


class PitcherDetail(Base):
    __tablename__ = "pitcher_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registrants.id"),
        nullable=False,
        unique=True,
    )
    project_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    pitch_summary = Column(Text)
    work_sample_url = Column(String)
    is_paid = Column(Boolean, default=False)
    amount_kobo = Column(Integer, nullable=True)
    paystack_reference = Column(String, nullable=True, unique=True)
    pending_payment_reference = Column(String, nullable=True, unique=True)

    registrant = relationship(
        "Registrant",
        back_populates="pitcher_detail",
    )


class InvestorDetail(Base):
    __tablename__ = "investor_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registrants.id"),
        nullable=False,
        unique=True,
    )
    organization_name = Column(String, nullable=False)
    investment_interest = Column(Text)
    budget_range = Column(String)
    portfolio_url = Column(String)

    registrant = relationship(
        "Registrant",
        back_populates="investor_detail",
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registrant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("registrants.id"),
        nullable=False,
        unique=True,
    )
    qr_code = Column(String, unique=True)
    ticket_number = Column(String, unique=True)
    # "First ever" check-in only — kept for the admin registrant detail
    # screen. Day-by-day entries live in ScanLog below, since one flag
    # can't represent "already came in today" vs "came in yesterday".
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))

    registrant = relationship(
        "Registrant",
        back_populates="ticket",
    )


class ScanLog(Base):
    """
    One row per check-in attempt at the door — accepted or duplicate.
    event_day is the Nigeria/WAT calendar date the scan counts toward,
    which is what makes "one accepted entry per ticket per day" and the
    admin date-picker scan log possible. Every attempt is logged, not
    just accepted ones, so a disputed entry at the gate can be checked.
    """

    __tablename__ = "scan_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_day = Column(Date, nullable=False, index=True)
    result = Column(String, nullable=False)  # "accepted" | "duplicate"
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())
    # For a "duplicate" row, the time of that day's original accepted
    # scan — saved here too so the admin log doesn't need a join to
    # show "already arrived at 08:00" next to each duplicate.
    first_entry_at = Column(DateTime(timezone=True), nullable=True)
    checked_in_by_admin_id = Column(
        UUID(as_uuid=True),
        ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Snapshot, same reasoning as AdminLog.admin_name: stays intact even
    # if the admin account is later deleted.
    checked_in_by_name = Column(String, nullable=True)

    ticket = relationship("Ticket")
