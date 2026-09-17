import resend

from app.config import settings

resend.api_key = settings.resend_api_key


RED = "#B80319"
GOLD = "#E59200"
TEAL = "#00A5A8"
INK = "#14100E"
CREAM = "#F5EFE6"


def _branded_html(html: str) -> str:
    return f"""
    <div style="margin:0;padding:30px 15px;background:{INK};font-family:Arial,Helvetica,sans-serif;color:{CREAM};">
        <div style="max-width:640px;margin:0 auto;background:{INK};">

            <div style="text-align:center;padding:10px 20px 25px;">
                <img
                    src="https://africacreativeshowcase.com/images/acs-logo.png"
                    alt="Africa Creative Showcase"
                    width="72"
                    style="display:block;width:72px;height:auto;margin:0 auto 15px;"
                >

                <div style="font-size:20px;font-weight:600;color:{CREAM};margin-bottom:15px;">
                    Africa Creative Showcase
                </div>

                <div style="display:flex;width:96px;height:4px;margin:0 auto;">
                    <div style="width:33.33%;background:{RED};"></div>
                    <div style="width:33.33%;background:{GOLD};"></div>
                    <div style="width:33.33%;background:{TEAL};"></div>
                </div>
            </div>

            <div style="padding:10px 25px 30px;color:{CREAM};font-size:15px;line-height:1.7;">
                {html}
            </div>

            <div style="border-top:1px solid #332c28;padding:20px 25px;text-align:center;">
                <div style="color:#B8ADA0;font-size:12px;">
                    Africa Creative Showcase
                </div>
                <div style="color:#B8ADA0;font-size:11px;margin-top:5px;">
                    africacreativeshowcase.com
                </div>
            </div>

        </div>
    </div>
    """


def send_email(to: list[str], subject: str, html: str) -> None:
    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": to,
            "subject": subject,
            "html": _branded_html(html),
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
    Send a reply from the Africa Creative Showcase contact address.
    """
    try:
        resend.Emails.send({
            "from": settings.reply_email,
            "to": [to],
            "subject": subject,
            "html": _branded_html(html),
        })

        return True

    except Exception as e:
        print(f"Failed to send message reply to {to}: {e}")
        return False