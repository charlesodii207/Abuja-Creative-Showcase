from fastapi import APIRouter

from app import schemas
from app.emailer import send_email


router = APIRouter(prefix="/sponsorship", tags=["sponsorship"])


SPONSORSHIP_RECIPIENTS = [
    "info@africacreativeshowcase.com",
    "director@africacreativeshowcase.com",
    "convener@africacreativeshowcase.com",
]


@router.post("/inquiry", response_model=schemas.SponsorInquiryResponse)
def submit_sponsor_inquiry(payload: schemas.SponsorInquiryRequest):
    package_line = (
        f"<p><strong>Package of interest:</strong> {payload.package_interest}</p>"
        if payload.package_interest
        else "<p><strong>Package of interest:</strong> Not specified</p>"
    )

    message_line = (
        f"<p><strong>Partnership interest:</strong> {payload.message}</p>"
        if payload.message
        else ""
    )

    send_email(
        to=SPONSORSHIP_RECIPIENTS,
        subject=f"New Sponsorship Enquiry — {payload.organization_name}",
        html=f"""
        <p>A new sponsorship partnership enquiry has been received.</p>

        <p><strong>Name:</strong> {payload.full_name}</p>
        <p><strong>Organization:</strong> {payload.organization_name}</p>
        <p><strong>Role / Position:</strong> {payload.role}</p>
        <p><strong>Email:</strong> {payload.email}</p>
        <p><strong>Phone:</strong> {payload.phone}</p>

        {package_line}
        {message_line}
        """,
    )

    return schemas.SponsorInquiryResponse(
        message="Thanks for reaching out! Our partnership team will be in touch shortly."
    )