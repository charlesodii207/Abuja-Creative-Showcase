import resend

from app.config import settings

resend.api_key = settings.resend_api_key

RED = "#B80319"
GOLD = "#E59200"
TEAL = "#00A5A8"
INK = "#14100E"
CREAM = "#F5EFE6"
MUTED = "#B8ADA0"


def _branded_html(html: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="margin:0;padding:0;background-color:{INK};">
        <tr>
            <td align="center" style="padding:30px 15px;background-color:{INK};">

                <table width="640" cellpadding="0" cellspacing="0" border="0"
                    style="width:100%;max-width:640px;background-color:{INK};">

                    <tr>
                        <td align="center" style="padding:10px 20px 25px;">

                            <img
                                src="https://africacreativeshowcase.com/images/acs-logo.png"
                                alt="Africa Creative Showcase"
                                width="72"
                                style="display:block;width:72px;height:auto;margin:0 auto 15px;"
                            >

                            <div style="
                                font-family:Arial,Helvetica,sans-serif;
                                font-size:20px;
                                font-weight:600;
                                color:{CREAM};
                                margin-bottom:15px;
                            ">
                                Africa Creative Showcase
                            </div>

                            <table cellpadding="0" cellspacing="0" border="0"
                                width="96" style="width:96px;">
                                <tr>
                                    <td width="32" height="4"
                                        style="background-color:{RED};font-size:0;">
                                        &nbsp;
                                    </td>
                                    <td width="32" height="4"
                                        style="background-color:{GOLD};font-size:0;">
                                        &nbsp;
                                    </td>
                                    <td width="32" height="4"
                                        style="background-color:{TEAL};font-size:0;">
                                        &nbsp;
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:10px 25px 30px;
                            background-color:{INK};
                            color:{CREAM};
                            font-family:Arial,Helvetica,sans-serif;
                            font-size:15px;
                            line-height:1.7;
                        ">
                            {html}
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="
                            border-top:1px solid #332C28;
                            padding:20px 25px;
                            background-color:{INK};
                            font-family:Arial,Helvetica,sans-serif;
                        ">
                            <div style="
                                color:{MUTED};
                                font-size:12px;
                            ">
                                Africa Creative Showcase
                            </div>

                            <div style="
                                color:{MUTED};
                                font-size:11px;
                                margin-top:5px;
                            ">
                                africacreativeshowcase.com
                            </div>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
    """


def send_email(
    to: list[str],
    subject: str,
    html: str,
    attachments: list[dict] | None = None,
) -> None:
    try:
        payload = {
            "from": settings.email_from,
            "to": to,
            "subject": subject,
            "html": _branded_html(html),
        }

        if attachments:
            payload["attachments"] = attachments

        resend.Emails.send(payload)

    except Exception as e:
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