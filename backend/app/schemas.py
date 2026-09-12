from pydantic import BaseModel, EmailStr
from app.models import TicketType, BoothSize


class AttendeeRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    ticket_type: TicketType = TicketType.general
    wants_masterclass: bool = False


class ExhibitorRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    company_name: str
    category: str
    what_bringing: str | None = None
    portfolio_url: str | None = None
    goal: str | None = None
    booth_size: BoothSize | None = None
    wants_auction: bool = False
    auction_item_description: str | None = None


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