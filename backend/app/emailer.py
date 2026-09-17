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
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Afriqa Creative Showcase</title>
<style>
    :root {{
        color-scheme: dark;
        supported-color-schemes: dark;
    }}

    body, table, td {{
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
    }}

    body {{
        margin: 0;
        padding: 0;
        width: 100% !important;
        background-color: {INK} !important;
    }}

    /* Force dark regardless of the device's own light/dark setting,
       so Gmail/Apple Mail have nothing "safe" left to auto-invert */
    @media (prefers-color-scheme: light) {{
        body, .email-bg {{ background-color: {INK} !important; }}
        .email-text {{ color: {CREAM} !important; }}
        .email-muted {{ color: {MUTED} !important; }}
    }}

    @media (prefers-color-scheme: dark) {{
        body, .email-bg {{ background-color: {INK} !important; }}
        .email-text {{ color: {CREAM} !important; }}
        .email-muted {{ color: {MUTED} !important; }}
    }}

    /* Gmail app dark-mode override hooks */
    [data-ogsc] .email-bg,
    [data-ogsb] .email-bg {{
        background-color: {INK} !important;
    }}

    [data-ogsc] .email-text,
    [data-ogsb] .email-text {{
        color: {CREAM} !important;
    }}
</style>
</head>
<body style="margin:0;padding:0;background-color:{INK};" bgcolor="{INK}">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg"
        style="margin:0;padding:0;background-color:{INK};" bgcolor="{INK}">
        <tr>
            <td align="center" class="email-bg" style="padding:30px 15px;background-color:{INK};" bgcolor="{INK}">

                <table width="640" cellpadding="0" cellspacing="0" border="0" class="email-bg"
                    style="width:100%;max-width:640px;background-color:{INK};" bgcolor="{INK}">

                    <tr>
                        <td align="center" style="padding:10px 20px 25px;">

                            <img
                                src="https://africacreativeshowcase.com/images/acs-logo.png"
                                alt="Afriqa Creative Showcase"
                                width="72"
                                style="display:block;width:72px;height:auto;margin:0 auto 15px;"
                            >

                            <div class="email-text" style="
                                font-family:Arial,Helvetica,sans-serif;
                                font-size:20px;
                                font-weight:600;
                                color:{CREAM};
                                margin-bottom:15px;
                            ">
                                Afriqa Creative Showcase
                            </div>

                            <table cellpadding="0" cellspacing="0" border="0"
                                width="96" style="width:96px;">
                                <tr>
                                    <td width="32" height="4"
                                        style="background-color:{RED};font-size:0;" bgcolor="{RED}">
                                        &nbsp;
                                    </td>
                                    <td width="32" height="4"
                                        style="background-color:{GOLD};font-size:0;" bgcolor="{GOLD}">
                                        &nbsp;
                                    </td>
                                    <td width="32" height="4"
                                        style="background-color:{TEAL};font-size:0;" bgcolor="{TEAL}">
                                        &nbsp;
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td class="email-bg email-text" style="
                            padding:10px 25px 30px;
                            background-color:{INK};
                            color:{CREAM};
                            font-family:Arial,Helvetica,sans-serif;
                            font-size:15px;
                            line-height:1.7;
                        " bgcolor="{INK}">
                            {html}
                        </td>
                    </tr>

                    <tr>
                        <td align="center" class="email-bg" style="
                            border-top:1px solid #332C28;
                            padding:20px 25px;
                            background-color:{INK};
                            font-family:Arial,Helvetica,sans-serif;
                        " bgcolor="{INK}">
                            <div class="email-muted" style="
                                color:{MUTED};
                                font-size:12px;
                            ">
                                Afriqa Creative Showcase
                            </div>

                            <div class="email-muted" style="
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
</body>
</html>
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
    Send a reply from the Afriqa Creative Showcase contact address.
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
