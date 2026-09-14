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


def send_message_reply(
    to: str,
    subject: str,
    html: str,
) -> bool:
    """
    Send a reply from the ACS contact address.

    This is intentionally separate from send_email() so existing
    registration, approval, payment, and notification emails continue
    using their current configuration.
    """
    try:
        resend.Emails.send({
            "from": "Abuja Creative Showcase <info@abujacreativeshowcase.com>",
            "to": [to],
            "subject": subject,
            "html": html,
        })

        return True

    except Exception as e:
        print(f"Failed to send message reply to {to}: {e}")
        return False