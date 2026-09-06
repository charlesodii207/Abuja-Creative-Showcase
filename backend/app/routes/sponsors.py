from fastapi import APIRouter

from app import schemas
from app.emailer import send_email
from app.config import settings

router = APIRouter(prefix="/sponsors", tags=["sponsors"])


@router.post("/inquiry", response_model=schemas.SponsorInquiryResponse)
def submit_sponsor_inquiry(payload: schemas.SponsorInquiryRequest):
    tier_line = f"<p><strong>Tier interested in:</strong> {payload.tier_interested}</p>" if payload.tier_interested else ""
    message_line = f"<p><strong>Message:</strong> {payload.message}</p>" if payload.message else ""

    send_email(
        to=settings.sponsor_inquiry_email,
        subject=f"New Sponsorship Inquiry — {payload.organization}",
        html=f"""
        <p>New sponsorship inquiry received:</p>
        <p><strong>Name:</strong> {payload.full_name}</p>
        <p><strong>Email:</strong> {payload.email}</p>
        <p><strong>Phone:</strong> {payload.phone}</p>
        <p><strong>Organization:</strong> {payload.organization}</p>
        {tier_line}
        {message_line}
        """,
    )

    return schemas.SponsorInquiryResponse(
        message="Thanks for reaching out! Our team will be in touch shortly."
    )