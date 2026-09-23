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
    auction_item_description: str | None = None
    auction_quantity: int | None = None

    @model_validator(mode="after")
    def check_exhibit_fields(self):
        if self.exhibit_type == ExhibitType.booth and not self.booth_size:
            raise ValueError(
                "booth_size is required when exhibit_type is 'booth'"
            )

        if self.exhibit_type == ExhibitType.auction:
            if not self.auction_item_description:
                raise ValueError(
                    "auction_item_description is required when exhibit_type is 'auction'"
                )

            if not self.auction_quantity or self.auction_quantity < 1:
                raise ValueError(
                    "auction_quantity must be at least 1 when exhibit_type is 'auction'"
                )

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

    class Config:
        from_attributes = True


class ContactReplyRequest(BaseModel):
    body: str


class ContactReplyResponse(BaseModel):
    message: ContactMessageSummary


class ContactUnreadCountResponse(BaseModel):
    unread_count: int


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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class CreateAdminRequest(BaseModel):
    full_name: str
    username: str
    temp_password: str
    role: str


class AdminSummary(BaseModel):
    id: str
    full_name: str
    username: str
    role: str
    is_active: bool
    must_change_password: bool
    last_login_at: str | None


class AdminLogSummary(BaseModel):
    id: str
    admin_name: str | None
    action: str
    target_type: str | None
    target_reference: str | None
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