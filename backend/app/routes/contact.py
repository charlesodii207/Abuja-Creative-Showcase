from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.emailer import send_email
from app.config import settings


router = APIRouter(
    prefix="/contact",
    tags=["contact"],
)


@router.post(
    "/inquiry",
    response_model=schemas.ContactInquiryResponse,
)
def submit_contact_inquiry(
    payload: schemas.ContactInquiryRequest,
    db: Session = Depends(get_db),
):
    # ------------------------------------------------------------------
    # Create the conversation thread
    # ------------------------------------------------------------------

    thread = models.ContactThread(
        sender_name=payload.full_name,
        sender_email=str(payload.email),
        sender_phone=payload.phone,
        subject=f"Contact Form Question — {payload.full_name}",
        status="open",
        is_replied=False,
    )

    db.add(thread)
    db.flush()

    # ------------------------------------------------------------------
    # Store the visitor's first message
    # ------------------------------------------------------------------

    message = models.ContactMessage(
        thread_id=thread.id,
        sender_type="visitor",
        sender_name=payload.full_name,
        sender_email=str(payload.email),
        subject=thread.subject,
        body=payload.question,
        is_read=False,
    )

    db.add(message)
    db.commit()

    # ------------------------------------------------------------------
    # Send notification to both Africa Creative Showcase inboxes
    # ------------------------------------------------------------------

    send_email(
        to=[
            settings.sponsor_inquiry_email,
            settings.admin_email,
        ],
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
        message=(
            "Thanks for reaching out! We'll get back to you shortly — "
            "keep an eye on your email for our response."
        )
    )