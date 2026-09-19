import resend
from html import escape
from urllib.parse import quote

from app.config import settings

resend.api_key = settings.resend_api_key

RED = "#B80319"
GOLD = "#E59200"
TEAL = "#00A5A8"
NAVY = "#11152F"
NAVY_LIGHT = "#171C3D"
CREAM = "#F5EFE6"
MUTED = "#B8ADA0"
BORDER = "#2A3158"

BRAND_NAME = "Afriqa Creative Showcase"
WEBSITE_URL = "https://africacreativeshowcase.com"


def _safe(value: object) -> str:
    return escape(str(value))


def _branded_html(html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">

<title>{BRAND_NAME}</title>

<style>
    :root {{
        color-scheme: dark;
        supported-color-schemes: dark;
    }}

    body,
    table,
    td {{
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
    }}

    body {{
        margin: 0;
        padding: 0;
        width: 100% !important;
        background-color: {NAVY} !important;
    }}

    @media (prefers-color-scheme: light) {{
        body,
        .email-bg {{
            background-color: {NAVY} !important;
        }}

        .email-text {{
            color: {CREAM} !important;
        }}

        .email-muted {{
            color: {MUTED} !important;
        }}
    }}

    @media (prefers-color-scheme: dark) {{
        body,
        .email-bg {{
            background-color: {NAVY} !important;
        }}

        .email-text {{
            color: {CREAM} !important;
        }}

        .email-muted {{
            color: {MUTED} !important;
        }}
    }}

    [data-ogsc] .email-bg,
    [data-ogsb] .email-bg {{
        background-color: {NAVY} !important;
    }}

    [data-ogsc] .email-text,
    [data-ogsb] .email-text {{
        color: {CREAM} !important;
    }}

    a {{
        color: {TEAL};
    }}
</style>
</head>

<body
    style="margin:0;padding:0;background-color:{NAVY};"
    bgcolor="{NAVY}"
>
    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        class="email-bg"
        style="margin:0;padding:0;background-color:{NAVY};"
        bgcolor="{NAVY}"
    >
        <tr>
            <td
                align="center"
                class="email-bg"
                style="padding:30px 15px;background-color:{NAVY};"
                bgcolor="{NAVY}"
            >

                <table
                    width="640"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    class="email-bg"
                    style="
                        width:100%;
                        max-width:640px;
                        background-color:{NAVY};
                    "
                    bgcolor="{NAVY}"
                >

                    <!-- HEADER -->

                    <tr>
                        <td
                            align="center"
                            style="padding:12px 20px 28px;"
                        >

                            <img
                                src="{WEBSITE_URL}/images/acs-logo.webp"
                                alt="{BRAND_NAME}"
                                width="72"
                                style="
                                    display:block;
                                    width:72px;
                                    height:auto;
                                    margin:0 auto 16px;
                                "
                            >

                            <div
                                class="email-text"
                                style="
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:20px;
                                    font-weight:600;
                                    line-height:1.3;
                                    color:{CREAM};
                                    margin-bottom:16px;
                                "
                            >
                                {BRAND_NAME}
                            </div>

                            <table
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                width="96"
                                style="width:96px;"
                            >
                                <tr>
                                    <td
                                        width="32"
                                        height="4"
                                        style="
                                            background-color:{RED};
                                            font-size:0;
                                            line-height:0;
                                        "
                                        bgcolor="{RED}"
                                    >
                                        &nbsp;
                                    </td>

                                    <td
                                        width="32"
                                        height="4"
                                        style="
                                            background-color:{GOLD};
                                            font-size:0;
                                            line-height:0;
                                        "
                                        bgcolor="{GOLD}"
                                    >
                                        &nbsp;
                                    </td>

                                    <td
                                        width="32"
                                        height="4"
                                        style="
                                            background-color:{TEAL};
                                            font-size:0;
                                            line-height:0;
                                        "
                                        bgcolor="{TEAL}"
                                    >
                                        &nbsp;
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- CONTENT -->

                    <tr>
                        <td
                            class="email-bg email-text"
                            style="
                                padding:10px 25px 32px;
                                background-color:{NAVY};
                                color:{CREAM};
                                font-family:Arial,Helvetica,sans-serif;
                                font-size:15px;
                                line-height:1.7;
                            "
                            bgcolor="{NAVY}"
                        >
                            {html}
                        </td>
                    </tr>

                    <!-- FOOTER -->

                    <tr>
                        <td
                            align="center"
                            class="email-bg"
                            style="
                                border-top:1px solid {BORDER};
                                padding:22px 25px;
                                background-color:{NAVY};
                                font-family:Arial,Helvetica,sans-serif;
                            "
                            bgcolor="{NAVY}"
                        >

                            <div
                                class="email-muted"
                                style="
                                    color:{MUTED};
                                    font-size:12px;
                                    line-height:1.5;
                                "
                            >
                                {BRAND_NAME}
                            </div>

                            <div
                                class="email-muted"
                                style="
                                    color:{MUTED};
                                    font-size:11px;
                                    line-height:1.5;
                                    margin-top:5px;
                                "
                            >
                                Abuja · Nigeria
                            </div>

                            <div
                                class="email-muted"
                                style="
                                    color:{MUTED};
                                    font-size:11px;
                                    line-height:1.5;
                                    margin-top:4px;
                                "
                            >
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
) -> bool:
    """
    Send an automated ACS email through Resend.

    Returns True when Resend accepts the message and False when
    sending fails. Failures are logged but do not raise into the
    registration/payment flow.
    """
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

        return True

    except Exception as e:
        print(f"Failed to send email to {to}: {e}")
        return False


def send_message_reply(
    to: str,
    subject: str,
    html: str,
) -> bool:
    """
    Send a human/admin reply from the ACS contact address.
    """
    try:
        resend.Emails.send(
            {
                "from": settings.reply_email,
                "to": [to],
                "subject": subject,
                "html": _branded_html(html),
            }
        )

        return True

    except Exception as e:
        print(f"Failed to send message reply to {to}: {e}")
        return False


def _button(
    label: str,
    url: str,
    color: str = GOLD,
) -> str:
    """
    Branded email CTA button.
    """
    return f"""
    <table
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="margin:24px 0;"
    >
        <tr>
            <td
                align="center"
                bgcolor="{color}"
                style="
                    border-radius:6px;
                    background-color:{color};
                "
            >
                <a
                    href="{_safe(url)}"
                    style="
                        display:inline-block;
                        padding:13px 22px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:14px;
                        font-weight:700;
                        line-height:1;
                        text-decoration:none;
                        color:{NAVY};
                        background-color:{color};
                        border-radius:6px;
                    "
                >
                    {_safe(label)}
                </a>
            </td>
        </tr>
    </table>
    """


def _reference_card(reference_number: str) -> str:
    """
    Branded reference-number block.
    """
    return f"""
    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            margin:22px 0;
            background-color:{NAVY_LIGHT};
            border:1px solid {BORDER};
        "
        bgcolor="{NAVY_LIGHT}"
    >
        <tr>
            <td style="padding:18px 20px;">
                <div
                    style="
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:11px;
                        line-height:1.4;
                        text-transform:uppercase;
                        letter-spacing:1px;
                        color:{MUTED};
                    "
                >
                    Reference Number
                </div>

                <div
                    style="
                        margin-top:6px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:18px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.5px;
                        color:{CREAM};
                    "
                >
                    {_safe(reference_number)}
                </div>
            </td>
        </tr>
    </table>
    """


def send_payment_required_email(
    to: str,
    full_name: str,
    reference_number: str,
    description: str,
    amount_naira: int,
    payment_url: str,
) -> bool:
    """
    Send a branded email asking the applicant to complete payment.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Thank you for registering for the Afriqa Creative Showcase.
    </p>

    {_reference_card(reference_number)}

    <p>
        Your registration for <strong>{_safe(description)}</strong>
        requires payment of
        <strong>₦{amount_naira:,}</strong>.
    </p>

    <p>
        Complete your payment using the button below.
    </p>

    {_button("Complete Payment", payment_url, GOLD)}

    <p>
        Your registration will be confirmed once your payment has been
        successfully verified.
    </p>
    """

    return send_email(
        to=[to],
        subject="Complete Your Afriqa Creative Showcase Registration",
        html=html,
    )


def send_application_received_email(
    to: str,
    full_name: str,
    reference_number: str,
    application_type: str,
) -> bool:
    """
    Send confirmation that a non-payment application was received.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Thank you for applying to the Afriqa Creative Showcase.
    </p>

    {_reference_card(reference_number)}

    <p>
        We've received your
        <strong>{_safe(application_type)}</strong>
        application successfully.
    </p>

    <p>
        Our team will review the information provided and contact you
        by email once there is an update.
    </p>

    <p>
        No further action is required from you at this stage.
    </p>
    """

    return send_email(
        to=[to],
        subject=(
            f"Your Afriqa Creative Showcase "
            f"{application_type.title()} Application"
        ),
        html=html,
    )


def send_application_under_review_email(
    to: str,
    full_name: str,
    reference_number: str,
) -> bool:
    """
    Send an under-review status notification.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Thank you for submitting your application to the
        Afriqa Creative Showcase.
    </p>

    {_reference_card(reference_number)}

    <p>
        Your application is currently <strong>under review</strong>.
    </p>

    <p>
        Our team will contact you by email once there is an update.
        There is nothing else you need to do at this stage.
    </p>
    """

    return send_email(
        to=[to],
        subject=(
            "Your Afriqa Creative Showcase "
            "Application Is Under Review"
        ),
        html=html,
    )


def send_application_approved_email(
    to: str,
    full_name: str,
    reference_number: str,
    next_steps: str | None = None,
) -> bool:
    """
    Send an application approval notification.
    """
    next_steps_html = ""

    if next_steps:
        next_steps_html = f"""
        <p>
            {_safe(next_steps)}
        </p>
        """

    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Good news — your application to the Afriqa Creative Showcase
        has been <strong>approved</strong>.
    </p>

    {_reference_card(reference_number)}

    {next_steps_html}

    <p>
        We look forward to having you at the showcase.
    </p>
    """

    return send_email(
        to=[to],
        subject=(
            "Your Afriqa Creative Showcase Application — Approved"
        ),
        html=html,
    )


def send_application_rejected_email(
    to: str,
    full_name: str,
    reference_number: str,
) -> bool:
    """
    Send an application rejection notification.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Thank you for applying to the Afriqa Creative Showcase.
    </p>

    {_reference_card(reference_number)}

    <p>
        After careful review, we're unable to offer you a spot
        for this edition.
    </p>

    <p>
        We truly appreciate your interest in the showcase and encourage
        you to stay connected with us for future opportunities.
    </p>
    """

    return send_email(
        to=[to],
        subject="Your Afriqa Creative Showcase Application",
        html=html,
    )


def send_payment_confirmed_email(
    to: str,
    full_name: str,
    reference_number: str,
) -> bool:
    """
    Send a payment confirmation notification.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Your payment has been successfully confirmed.
    </p>

    {_reference_card(reference_number)}

    <p>
        Your registration is now confirmed for the
        Afriqa Creative Showcase.
    </p>

    <p>
        We look forward to welcoming you to the showcase.
    </p>
    """

    return send_email(
        to=[to],
        subject="Payment Confirmed — Afriqa Creative Showcase",
        html=html,
    )


def send_awaiting_payment_email(
    to: str,
    full_name: str,
    reference_number: str,
) -> bool:
    """
    Send a branded notification that payment is still required.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Your registration for the Afriqa Creative Showcase is almost
        complete, but payment is still needed to secure your spot.
    </p>

    {_reference_card(reference_number)}

    <p>
        Please complete the outstanding payment to finish your
        registration.
    </p>

    <p>
        If you already completed payment, please allow some time for
        verification before taking further action.
    </p>
    """

    return send_email(
        to=[to],
        subject="Complete Your Registration — Afriqa Creative Showcase",
        html=html,
    )


def send_ticket_email(
    to: str,
    full_name: str,
    ticket_number: str,
    category_tag: str,
    qr_base64: str,
) -> bool:
    """
    Send the issued ticket and QR code to the registrant.
    """
    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        Your payment has been confirmed — here's your ticket for the
        Afriqa Creative Showcase.
    </p>

    <p>
        <strong>Ticket Number:</strong> {_safe(ticket_number)}
    </p>

    <p>
        <strong>Category:</strong> {_safe(category_tag)}
    </p>

    <p>
        Your QR code ticket is attached to this email — show it at the
        entrance. If it can't be scanned for any reason, staff can type
        in your ticket number instead.
    </p>

    <p>See you at the show!</p>
    """

    return send_email(
        to=[to],
        subject="Your Afriqa Creative Showcase Ticket",
        html=html,
        attachments=[
            {
                "filename": "acs-ticket-qr.png",
                "content": qr_base64,
            }
        ],
    )


def registration_verify_url(reference_number: str) -> str:
    """
    Build the generic registration continuation URL.

    This should only be used once the frontend /verify page is live.
    """
    return (
        f"{settings.frontend_url.rstrip('/')}"
        f"/verify?ref={quote(reference_number)}"
    )


def send_registration_continue_email(
    to: str,
    full_name: str,
    reference_number: str,
    message: str,
) -> bool:
    """
    Send a generic registration continuation email.

    The /verify page determines whether the applicant needs to:
    - complete payment,
    - provide additional information,
    - or simply wait for review.
    """
    verify_url = registration_verify_url(reference_number)

    html = f"""
    <p>Hi {_safe(full_name)},</p>

    <p>
        {_safe(message)}
    </p>

    {_reference_card(reference_number)}

    <p>
        Use the button below to continue your registration.
    </p>

    {_button("Continue Registration", verify_url, TEAL)}

    <p>
        Your reference number will be used to securely identify
        your application.
    </p>
    """

    return send_email(
        to=[to],
        subject="Continue Your Afriqa Creative Showcase Registration",
        html=html,
    )