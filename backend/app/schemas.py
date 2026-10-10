from datetime import datetime

from pydantic import BaseModel, EmailStr, model_validator

from app.models import TicketType, BoothSize, ExhibitType


class AttendeeRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    ticket_type: TicketType = TicketType.general


class ExhibitorRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    company_name: str
    category: str
    what_bringing: str | None = None
    portfolio_url: str | None = None
    goal: str | None = None
    exhibit_type: ExhibitType
    booth_size: BoothSize | None = None
    # Auction has been removed. These two fields are kept only so old
    # clients and existing rows don't break; new registrations can't use them.
    auction_item_description: str | None = None
    auction_quantity: int | None = None

    @model_validator(mode="after")
    def check_exhibit_fields(self):
        if self.exhibit_type == ExhibitType.auction:
            raise ValueError("The auction option is no longer available.")

        if self.exhibit_type == ExhibitType.booth:
            if not self.booth_size:
                raise ValueError(
                    "booth_size is required when exhibit_type is 'booth'"
                )

        if self.exhibit_type == ExhibitType.fashion_runway:
            # Flat-priced option: no booth size applies.
            self.booth_size = None

        # Neither remaining option uses the old auction fields.
        self.auction_item_description = None
        self.auction_quantity = None

        return self


class PressRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    outlet_name: str
    proof_type: str | None = None
    proof_url: str | None = None


class PitcherRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    project_name: str
    category: str
    pitch_summary: str | None = None
    work_sample_url: str | None = None


class InvestorRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    organization_name: str
    investment_interest: str | None = None
    budget_range: str | None = None
    portfolio_url: str | None = None


class RegistrationResponse(BaseModel):
    reference_number: str
    message: str
    amount_kobo: int | None = None
    paystack_authorization_url: str | None = None


class LookupRequest(BaseModel):
    reference_number: str


class LookupResponse(BaseModel):
    full_name: str
    category: str
    status: str
    reference_number: str


class UpgradeRequest(BaseModel):
    reference_number: str
    ticket_type: TicketType


class UpgradeResponse(BaseModel):
    reference_number: str
    ticket_type: str
    message: str
    amount_kobo: int | None = None
    paystack_authorization_url: str | None = None


class RegistrantSummary(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    category: str
    reference_number: str
    status: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class AdminActionResponse(BaseModel):
    id: str
    status: str
    message: str


class TicketInfo(BaseModel):
    ticket_number: str | None
    checked_in: bool
    checked_in_at: datetime | None


class RegistrantDetail(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    category: str
    reference_number: str
    status: str
    created_at: datetime | None
    details: dict
    ticket: TicketInfo | None = None


class EditRegistrantRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class StatsResponse(BaseModel):
    total_registrants: int
    by_category: dict[str, int]
    by_status: dict[str, int]
    attendees_paid: int
    attendees_unpaid: int
    exhibitors_paid: int
    exhibitors_unpaid: int
    # Added for the Analytics page's Revenue and Today's check-ins
    # sections. All additive — existing consumers of this response
    # (e.g. Overview) are unaffected by fields they don't read.
    pitchers_paid: int
    pitchers_unpaid: int
    revenue_kobo_total: int
    revenue_kobo_by_category: dict[str, int]
    today_checked_in: int
    today_duplicate_scans: int


class OverviewStatsResponse(BaseModel):
    """Headline counts for the Overview page, visible to every admin.
    Revenue and check-in figures are deliberately not included; those
    belong to Analytics."""
    total_registrants: int
    by_category: dict[str, int]
    by_status: dict[str, int]
    attendees_paid: int
    attendees_unpaid: int
    exhibitors_paid: int
    exhibitors_unpaid: int


class SponsorInquiryRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    organization_name: str
    role: str
    package_interest: str | None = None
    message: str | None = None


class SponsorInquiryResponse(BaseModel):
    message: str


class ContactInquiryRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    question: str


class ContactInquiryResponse(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Contact messaging
# ---------------------------------------------------------------------------

class ContactMessageSummary(BaseModel):
    id: str
    sender_type: str
    sender_name: str
    sender_email: str
    subject: str
    body: str
    admin_id: str | None = None
    is_read: bool
    created_at: datetime | None
    direction: str | None = None          # "inbound" | "outbound"
    mailbox: str | None = None
    to_addresses: str | None = None
    cc_addresses: str | None = None
    has_html: bool = False                # original HTML exists: fetch /admin/messages/html/{id}

    class Config:
        from_attributes = True


class ContactThreadSummary(BaseModel):
    id: str
    sender_name: str
    sender_email: str
    sender_phone: str | None = None
    subject: str
    status: str
    is_replied: bool
    unread_count: int
    created_at: datetime | None
    updated_at: datetime | None
    latest_message: ContactMessageSummary | None = None
    mailbox: str | None = None
    channel: str = "form"                 # "form" | "email"

    class Config:
        from_attributes = True


class ContactThreadDetail(BaseModel):
    id: str
    sender_name: str
    sender_email: str
    sender_phone: str | None = None
    subject: str
    status: str
    is_replied: bool
    unread_count: int
    created_at: datetime | None
    updated_at: datetime | None
    messages: list[ContactMessageSummary]
    mailbox: str | None = None
    channel: str = "form"

    class Config:
        from_attributes = True


class ContactReplyRequest(BaseModel):
    body: str


class ContactReplyResponse(BaseModel):
    message: ContactMessageSummary


class ContactUnreadCountResponse(BaseModel):
    unread_count: int
    by_mailbox: dict[str, int] = {}


class MailboxOption(BaseModel):
    key: str
    label: str
    address: str
    can_send: bool


class SendMailRequest(BaseModel):
    mailbox: str                  # a key like "info", never a raw address
    to: list[EmailStr]
    cc: list[EmailStr] = []
    subject: str
    body: str                     # plain text; escaped + wrapped in the branded template


class MailSyncStatus(BaseModel):
    mailbox: str
    last_synced_at: datetime | None = None
    last_error: str | None = None


# ---------------------------------------------------------------------------
# Paystack
# ---------------------------------------------------------------------------

class PaystackInitializeRequest(BaseModel):
    reference_number: str


class PaystackInitializeResponse(BaseModel):
    authorization_url: str
    access_code: str
    reference: str


class PaystackVerifyRequest(BaseModel):
    reference_number: str


class PaystackVerifyResponse(BaseModel):
    reference_number: str
    status: str
    message: str


# ---------------------------------------------------------------------------
# Smart registration verification
# ---------------------------------------------------------------------------

class RegistrationVerifyResponse(BaseModel):
    reference_number: str
    full_name: str
    category: str
    status: str
    action: str
    message: str
    amount_kobo: int | None = None


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------

class CheckinRequest(BaseModel):
    ticket_number: str


class CheckinResponse(BaseModel):
    result: str
    full_name: str
    category_tag: str
    checked_in_at: datetime | None
    message: str


# ---------------------------------------------------------------------------
# Admin auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    must_change_password: bool
    full_name: str
    role: str
    # Sections this admin can use (from their departments; everything for
    # super admins and the system owner).
    permissions: list[str] = []
    # Shared mailboxes this admin can read / send from.
    mailboxes_read: list[str] = []
    mailboxes_send: list[str] = []


class MeResponse(BaseModel):
    """The signed-in admin's current role and sections, read fresh from the
    database so the sidebar can follow changes made by a super admin."""
    full_name: str
    role: str
    permissions: list[str] = []
    mailboxes_read: list[str] = []
    mailboxes_send: list[str] = []


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class CreateAdminRequest(BaseModel):
    full_name: str
    username: str
    temp_password: str
    role: str
    departments: list[str] = []
    extra_permissions: list[str] = []


class UpdateAdminDepartmentsRequest(BaseModel):
    departments: list[str]
    # None means "leave the individual sections as they are".
    extra_permissions: list[str] | None = None


class UpdateAdminMailboxesRequest(BaseModel):
    mailboxes_read: list[str] = []
    mailboxes_send: list[str] = []


class ChangeAdminRoleRequest(BaseModel):
    role: str


class AdminSummary(BaseModel):
    id: str
    full_name: str
    username: str
    role: str
    is_active: bool
    must_change_password: bool
    last_login_at: str | None
    departments: list[str] = []
    extra_permissions: list[str] = []
    mailboxes_read: list[str] = []
    mailboxes_send: list[str] = []


class AdminLogSummary(BaseModel):
    id: str
    admin_name: str | None
    action: str
    target_type: str | None
    target_reference: str | None
    # The registrant's name, filled in via a join when target_type is
    # "registrant" and that reference still exists — lets the logs page
    # show "Kelly Doty" instead of making the reader cross-reference the
    # reference number themselves, and makes searching by name work.
    target_name: str | None = None
    detail: str | None
    created_at: datetime | None


# ---------------------------------------------------------------------------
# Attendee status / resume payment
# ---------------------------------------------------------------------------

class AttendeeStatusRequest(BaseModel):
    reference_number: str


class AttendeeStatusResponse(BaseModel):
    reference_number: str
    full_name: str
    ticket_type: str
    is_paid: bool
    status: str
    message: str


class ResumePaymentRequest(BaseModel):
    reference_number: str


class ResumePaymentResponse(BaseModel):
    reference_number: str
    amount_kobo: int
    paystack_authorization_url: str
    message: str


# ---------------------------------------------------------------------------
# Scan log (multi-day check-in)
# ---------------------------------------------------------------------------

class ScanLogEntry(BaseModel):
    id: str
    ticket_number: str
    full_name: str
    category_tag: str
    result: str  # "accepted" | "duplicate"
    scanned_at: datetime
    checked_in_by: str | None = None


class ScanLogResponse(BaseModel):
    event_day: str
    total_scans: int
    accepted_count: int
    duplicate_count: int
    entries: list[ScanLogEntry]