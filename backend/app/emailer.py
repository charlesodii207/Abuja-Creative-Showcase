import resend

from app.config import settings

resend.api_key = settings.resend_api_key


def send_email(to: list[str], subject: str, html: str) -> None:
    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": to,
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        # Don't let a failed email crash the registration/approval flow.
        print(f"Failed to send email to {to}: {e}")