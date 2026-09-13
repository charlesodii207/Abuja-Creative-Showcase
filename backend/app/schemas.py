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
    booth_size: BoothSize | None = None            # required if exhibit_type == booth
    auction_item_description: str | None = None    # required if exhibit_type == auction
    auction_quantity: int | None = None            # required if exhibit_type == auction, min 1

    @model_validator(mode="after")
    def check_exhibit_fields(self):
        if self.exhibit_type == ExhibitType.booth and not self.booth_size:
            raise ValueError("booth_size is required when exhibit_type is 'booth'")
        if self.exhibit_type == ExhibitType.auction:
            if not self.auction_item_description:
                raise ValueError("auction_item_description is required when exhibit_type is 'auction'")
            if not self.auction_quantity or self.auction_quantity < 1:
                raise ValueError("auction_quantity must be at least 1 when exhibit_type is 'auction'")
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
    amount_kobo: int | None = None          # present when this category requires payment
    paystack_authorization_url: str | None = None  # present once payment is initialized


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
    organization: str
    tier_interested: str | None = None
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


# --- Paystack ---

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
    status: str          # "confirmed" or "failed"
    message: str