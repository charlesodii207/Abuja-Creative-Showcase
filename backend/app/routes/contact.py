from fastapi import APIRouter

from app import schemas
from app.emailer import send_email
from app.config import settings

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("/inquiry", response_model=schemas.ContactInquiryResponse)
def submit_contact_inquiry(payload: schemas.ContactInquiryRequest):
    send_email(
        to=settings.sponsor_inquiry_email,
        subject=f"New Contact Form Question — {payload.full_name}",
        html=f"""
        <p>New question received via the contact form:</p>
        <p><strong>Name:</strong> {payload.full_name}</p>
        <p><strong>Email:</strong> {payload.email}</p>
        <p><strong>Phone:</strong> {payload.phone}</p>
        <p><strong>Question:</strong> {payload.question}</p>
        """,
    )

    return schemas.ContactInquiryResponse(
        message="Thanks for reaching out! We'll get back to you shortly — keep an eye on your email for our response."
    )