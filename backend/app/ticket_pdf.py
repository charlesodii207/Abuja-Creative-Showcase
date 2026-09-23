"""
Builds the printable ACS 2026 event ticket as a PDF.

Layout: 180 x 100 mm landscape, a dark main panel plus a light tear-off
stub. The ticket number is the largest text on the ticket and the QR code
is deliberately big, so door staff can scan or read it quickly.

The QR code encodes the ticket number itself (exactly what the scanner and
the manual-entry box already accept).

Needs only `reportlab` (add it to requirements.txt).
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from reportlab.graphics.barcode import qrencoder
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ---------------------------------------------------------------------------
# Brand + event constants
# ---------------------------------------------------------------------------

NAVY_DEEP = HexColor("#0B0E22")
NAVY = HexColor("#11152F")
NAVY_LIGHT = HexColor("#1A2045")
RED = HexColor("#B80319")
GOLD = HexColor("#E59200")
TEAL = HexColor("#00A5A8")
CREAM = HexColor("#F5EFE6")
MUTED = HexColor("#B8ADA0")
MUTED_DARK = HexColor("#6B6660")

EVENT_NAME = "AFRIQA CREATIVE SHOWCASE"
EVENT_SHORT = "ACS 2026"
EVENT_DATES = "04 \u2013 05 Dec 2026"
EVENT_VENUE = "Abuja, Nigeria"
WEBSITE = "africacreativeshowcase.com"
CHECKIN_NOTE = (
    "Present this ticket at check-in each day. "
    "Do not share, forward or publish it."
)

PAGE_W = 180 * mm
PAGE_H = 100 * mm
DIVIDER_X = 128  # mm: where the main panel ends and the stub begins

ASSETS_DIR = Path(__file__).parent / "assets"
LOGO_PATH = ASSETS_DIR / "acs-logo.png"
FALLBACK_FONT_PATH = ASSETS_DIR / "fonts" / "DejaVuSans-Bold.ttf"
FALLBACK_FONT = "ACSFallbackBold"

_fallback_registered = False


def _register_fallback_font() -> bool:
    """Registers a bundled font for names with characters Helvetica lacks."""
    global _fallback_registered
    if _fallback_registered:
        return True
    if FALLBACK_FONT_PATH.exists():
        pdfmetrics.registerFont(TTFont(FALLBACK_FONT, str(FALLBACK_FONT_PATH)))
        _fallback_registered = True
    return _fallback_registered


def _font_for(text: str, base_font: str = "Helvetica-Bold") -> str:
    """Use Helvetica when the text fits its character set, else the fallback."""
    try:
        text.encode("cp1252")
        return base_font
    except UnicodeEncodeError:
        return FALLBACK_FONT if _register_fallback_font() else base_font


# ---------------------------------------------------------------------------
# Small drawing helpers (all sizes in mm unless noted; fonts in points)
# ---------------------------------------------------------------------------


def _mix(c1: Color, c2: Color, t: float) -> Color:
    return Color(
        c1.red + (c2.red - c1.red) * t,
        c1.green + (c2.green - c1.green) * t,
        c1.blue + (c2.blue - c1.blue) * t,
    )


def _color_at(stops: list[tuple[float, Color]], t: float) -> Color:
    if t <= stops[0][0]:
        return stops[0][1]
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        if t <= p1:
            span = (p1 - p0) or 1
            return _mix(c0, c1, (t - p0) / span)
    return stops[-1][1]


def _h_gradient(c, x, y, w, h, stops, steps=90):
    """Left-to-right gradient built from thin strips (mm)."""
    step_w = w / steps
    for i in range(steps):
        c.setFillColor(_color_at(stops, (i + 0.5) / steps))
        c.rect((x + i * step_w) * mm, y * mm, (step_w + 0.15) * mm, h * mm, stroke=0, fill=1)


def _v_gradient(c, x, y, w, h, stops, steps=70):
    """Bottom-to-top gradient built from thin strips (mm)."""
    step_h = h / steps
    for i in range(steps):
        c.setFillColor(_color_at(stops, (i + 0.5) / steps))
        c.rect(x * mm, (y + i * step_h) * mm, w * mm, (step_h + 0.15) * mm, stroke=0, fill=1)


def _text_width(text, font, size, spacing=0.0) -> float:
    """Width in mm, including letter spacing."""
    return (stringWidth(text, font, size) + spacing * len(text)) / mm


def _text(c, text, x, y, font, size, color, spacing=0.0, align="left"):
    """Draws text with optional letter spacing. x/y in mm; align left/center/right."""
    width = _text_width(text, font, size, spacing)
    if align == "center":
        x = x - width / 2
    elif align == "right":
        x = x - width
    t = c.beginText()
    t.setTextOrigin(x * mm, y * mm)
    t.setFont(font, size)
    t.setCharSpace(spacing)
    t.setFillColor(color)
    t.textOut(text)
    c.drawText(t)


def _fit_size(text, font, size, max_w_mm, spacing=0.0, min_size=7.0) -> float:
    """Shrinks the font size until the text fits in max_w_mm."""
    while size > min_size and _text_width(text, font, size, spacing) > max_w_mm:
        size -= 0.5
    return size


def _fit_text(text, font, size, max_w_mm, spacing=0.0, min_size=8.0):
    """Returns (text, size) that fits; adds an ellipsis only as a last resort."""
    size = _fit_size(text, font, size, max_w_mm, spacing, min_size)
    while len(text) > 3 and _text_width(text, font, size, spacing) > max_w_mm:
        text = text[:-2].rstrip() + "\u2026"
    return text, size


def _split_label(label: str) -> list[str]:
    """'GENERAL ADMISSION' -> ['GENERAL', 'ADMISSION']; one word stays as is."""
    words = label.upper().split()
    if len(words) <= 1:
        return [label.upper()]
    return [" ".join(words[:-1]), words[-1]]


def _qr_modules(data: str) -> list[list[bool]]:
    """Smallest QR (error correction M) that holds `data`, as a bool grid."""
    last_error = None
    for version in range(1, 15):
        try:
            qr = qrencoder.QRCode(version, qrencoder.QRErrorCorrectLevel.M)
            qr.addData(data)
            qr.make()
            n = qr.getModuleCount()
            return [[bool(qr.isDark(r, cidx)) for cidx in range(n)] for r in range(n)]
        except Exception as exc:  # data too long for this version: try the next
            last_error = exc
    raise ValueError(f"Could not build a QR code for the ticket: {last_error}")


def _draw_qr(c, data, box_x, box_y, box_size, qr_size):
    """White rounded box (mm) with a crisp vector QR centred inside it."""
    c.setFillColor(white)
    c.roundRect(box_x * mm, box_y * mm, box_size * mm, box_size * mm, 3 * mm, stroke=0, fill=1)

    grid = _qr_modules(data)
    n = len(grid)
    module = qr_size / n
    origin_x = box_x + (box_size - qr_size) / 2
    top_y = box_y + (box_size + qr_size) / 2

    c.setFillColor(HexColor("#000000"))
    for r, row in enumerate(grid):
        cidx = 0
        while cidx < n:  # merge runs of dark modules into one rectangle
            if row[cidx]:
                start = cidx
                while cidx < n and row[cidx]:
                    cidx += 1
                c.rect(
                    (origin_x + start * module) * mm,
                    (top_y - (r + 1) * module) * mm,
                    ((cidx - start) * module + 0.02) * mm,
                    (module + 0.02) * mm,
                    stroke=0,
                    fill=1,
                )
            else:
                cidx += 1


def _draw_logo(c, x, y, size):
    if LOGO_PATH.exists():
        c.drawImage(
            str(LOGO_PATH), x * mm, y * mm, size * mm, size * mm,
            mask="auto", preserveAspectRatio=True,
        )


def _draw_pinwheel(c, cx, cy, r, alpha):
    """Four-colour diamond motif echoing the ACS logo (decoration)."""
    c.saveState()
    quarters = [
        (NAVY_LIGHT, [(cx, cy), (cx - r, cy), (cx, cy + r)]),
        (GOLD, [(cx, cy), (cx, cy + r), (cx + r, cy)]),
        (RED, [(cx, cy), (cx + r, cy), (cx, cy - r)]),
        (TEAL, [(cx, cy), (cx, cy - r), (cx - r, cy)]),
    ]
    gap = 0.5
    for color, pts in quarters:
        c.setFillColor(Color(color.red, color.green, color.blue, alpha))
        p = c.beginPath()
        # shift each triangle away from the centre a touch to make white gaps
        sx = 1 if pts[1][0] >= cx and pts[2][0] >= cx else (-1 if pts[1][0] <= cx and pts[2][0] <= cx else 0)
        sy = 1 if pts[1][1] >= cy and pts[2][1] >= cy else (-1 if pts[1][1] <= cy and pts[2][1] <= cy else 0)
        for i, (px, py) in enumerate(pts):
            px += sx * gap
            py += sy * gap
            (p.moveTo if i == 0 else p.lineTo)(px * mm, py * mm)
        p.close()
        c.drawPath(p, stroke=0, fill=1)
    c.restoreState()


def _draw_banner(c, x0, y0, w, h, lines, size, text_x, slant=3.0):
    """Gradient type banner with a slanted right edge and 1-2 lines of text."""
    c.saveState()
    p = c.beginPath()
    p.moveTo(x0 * mm, y0 * mm)
    p.lineTo((x0 + w + slant) * mm, y0 * mm)
    p.lineTo((x0 + w - slant) * mm, (y0 + h) * mm)
    p.lineTo(x0 * mm, (y0 + h) * mm)
    p.close()
    c.clipPath(p, stroke=0, fill=0)
    _h_gradient(c, x0, y0, w + slant, h, [(0.0, TEAL), (1.0, GOLD)])
    c.restoreState()

    n = len(lines)
    line_h = size * 0.3528 * 1.18  # pt -> mm, with a little leading
    cap = size * 0.3528 * 0.72
    block = cap + (n - 1) * line_h
    last_baseline = y0 + (h - block) / 2          # baseline of the bottom line
    first_baseline = last_baseline + (n - 1) * line_h
    for i, line in enumerate(lines):
        _text(c, line, text_x, first_baseline - i * line_h,
              "Helvetica-Bold", size, NAVY_DEEP, spacing=0.3)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def ticket_labels_for(registrant) -> tuple[str, str]:
    """
    Returns (ticket_label, holder_label) for a registrant, e.g.
    ("GENERAL ADMISSION", "ATTENDEE"). Uses the same live data the door
    scanner uses, so an upgraded ticket prints its new type.
    """
    from app import models  # local import keeps this module easy to test

    category = registrant.category

    if category == models.RegistrantCategory.attendee:
        tier = registrant.attendee_detail.ticket_type
        label = {
            models.TicketType.general: "GENERAL ADMISSION",
            models.TicketType.vip: "VIP ACCESS",
            models.TicketType.masterclass: "MASTERCLASS ACCESS",
        }[tier]
        return label, "ATTENDEE"

    if category == models.RegistrantCategory.exhibitor:
        return "EXHIBITOR ACCESS", "EXHIBITOR"

    if category == models.RegistrantCategory.pitcher:
        return "PITCHER ACCESS", "PITCHER"

    name = category.value.upper()
    return f"{name} PASS", name


def ticket_pdf_filename(reference_number: str) -> str:
    """ACS-92KT7XMD -> ACS-2026-Ticket-ACS92KT7XMD.pdf"""
    return f"ACS-2026-Ticket-{reference_number.replace('-', '')}.pdf"


def generate_ticket_pdf(
    *,
    ticket_number: str,
    full_name: str,
    reference_number: str,
    ticket_label: str,
    holder_label: str = "ATTENDEE",
) -> bytes:
    """Renders the ticket and returns the PDF as bytes."""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(PAGE_W, PAGE_H))
    c.setTitle(f"ACS 2026 Ticket - {ticket_number}")
    c.setAuthor("Afriqa Creative Showcase")
    c.setSubject("Official event ticket")

    div = DIVIDER_X

    # --- clip everything to a rounded ticket shape ------------------------
    c.saveState()
    clip = c.beginPath()
    clip.roundRect(0, 0, PAGE_W, PAGE_H, 4 * mm)
    c.clipPath(clip, stroke=0, fill=0)

    # --- MAIN PANEL ---------------------------------------------------------
    _v_gradient(c, 0, 0, div, 100, [(0.0, NAVY_DEEP), (0.6, NAVY), (1.0, NAVY_LIGHT)])

    c.saveState()
    main_clip = c.beginPath()
    main_clip.rect(0, 0, div * mm, PAGE_H)
    c.clipPath(main_clip, stroke=0, fill=0)

    # decorative rings + pinwheel
    c.setLineWidth(0.35 * mm)
    c.setStrokeColor(GOLD)
    c.setStrokeAlpha(0.16)
    c.circle(112 * mm, 6 * mm, 46 * mm, stroke=1, fill=0)
    c.circle(112 * mm, 6 * mm, 36 * mm, stroke=1, fill=0)
    c.setStrokeColor(TEAL)
    c.setStrokeAlpha(0.18)
    c.circle(2 * mm, 8 * mm, 26 * mm, stroke=1, fill=0)
    c.setStrokeAlpha(1)
    _draw_pinwheel(c, 116, 88, 18, alpha=0.20)
    c.restoreState()

    # logo + event name
    _draw_logo(c, 9, 80, 15)
    _text(c, EVENT_SHORT, 27, 89.6, "Helvetica-Bold", 19, white, spacing=0.6)
    _text(c, EVENT_NAME, 27, 84.4, "Helvetica-Bold", 6.2, GOLD, spacing=1.3)

    # ticket type banner
    lines = _split_label(ticket_label)
    banner_size = 17
    widest = max(_text_width(l, "Helvetica-Bold", banner_size, 0.3) for l in lines)
    banner_w = max(58, widest + 9 + 10)
    _draw_banner(c, 0, 57, banner_w, 16, lines, banner_size, text_x=9)

    _text(c, "EVENT TICKET", 9, 51.6, "Helvetica-Bold", 8.5, white, spacing=3.2)

    # holder
    _text(c, holder_label.upper(), 9, 44.6, "Helvetica-Bold", 6.5, GOLD, spacing=1.6)
    name_font = _font_for(full_name)
    name_txt, name_size = _fit_text(full_name, name_font, 20, 66)
    _text(c, name_txt, 9, 37.4, name_font, name_size, white)

    # TICKET NUMBER: the biggest text on the ticket
    _text(c, "TICKET NO.", 9, 31.4, "Helvetica-Bold", 6.5, GOLD, spacing=1.6)
    tn_spacing = 1.4
    tn_size = _fit_size(ticket_number, "Helvetica-Bold", 28, 66, tn_spacing, min_size=14)
    _text(c, ticket_number, 9, 22.6, "Helvetica-Bold", tn_size, white, spacing=tn_spacing)

    # bottom info row
    c.setStrokeColor(white)
    c.setStrokeAlpha(0.14)
    c.setLineWidth(0.25 * mm)
    c.line(9 * mm, 17.4 * mm, 122 * mm, 17.4 * mm)
    c.setStrokeAlpha(1)

    access_display = ticket_label.title().replace("Vip", "VIP")
    cols = [
        (9, "EVENT DATE", EVENT_DATES),
        (46, "VENUE", EVENT_VENUE),
        (80, "ACCESS", access_display),
    ]
    for cx, lab, val in cols:
        _text(c, lab, cx, 13.4, "Helvetica-Bold", 5.2, GOLD, spacing=1.1)
        _text(c, val, cx, 9.0, "Helvetica-Bold", 8.4, white)

    _text(c, CHECKIN_NOTE, 9, 4.2, "Helvetica", 5.3, MUTED)
    _text(c, WEBSITE, 122, 4.2, "Helvetica", 5.3, MUTED, align="right")

    # BIG QR (main panel)
    qr_box, qr_size = 44, 34
    qr_x = div - qr_box - 6
    qr_y = 27
    _draw_qr(c, ticket_number, qr_x, qr_y, qr_box, qr_size)
    _text(c, "SCAN TO VERIFY", qr_x + qr_box / 2, 21.8, "Helvetica-Bold", 6.6, white,
          spacing=2.0, align="center")

    # --- STUB ----------------------------------------------------------------
    stub_x, stub_w = div, 180 - div
    c.setFillColor(CREAM)
    c.rect(stub_x * mm, 0, stub_w * mm, PAGE_H, stroke=0, fill=1)

    stub_cx = stub_x + stub_w / 2
    left = stub_x + 5
    inner_w = stub_w - 10

    _draw_logo(c, left, 85, 10)
    _text(c, EVENT_SHORT, left + 12.5, 91.2, "Helvetica-Bold", 11.5, NAVY, spacing=0.4)
    _text(c, "AFRIQA CREATIVE", left + 12.5, 87.4, "Helvetica-Bold", 4.3, MUTED_DARK, spacing=0.8)
    _text(c, "SHOWCASE", left + 12.5, 84.9, "Helvetica-Bold", 4.3, MUTED_DARK, spacing=0.8)

    stub_size = 8.8
    stub_widest = max(_text_width(l, "Helvetica-Bold", stub_size, 0.3) for l in lines)
    _draw_banner(c, stub_x + 4, 69.5, min(inner_w + 1, stub_widest + 8), 12, lines, stub_size,
                 text_x=stub_x + 7, slant=2.0)

    stub_name, stub_name_size = _fit_text(full_name, name_font, 9.5, inner_w)
    _text(c, stub_name, left, 64.6, name_font, stub_name_size, NAVY)

    _text(c, "REG. REF.", left, 59.6, "Helvetica-Bold", 4.6, GOLD, spacing=1.0)
    _text(c, reference_number, left, 56.2, "Helvetica-Bold", 7.6, NAVY, spacing=0.4)

    _text(c, "TICKET NO.", left, 52.0, "Helvetica-Bold", 4.6, GOLD, spacing=1.0)
    stub_tn_size = _fit_size(ticket_number, "Helvetica-Bold", 13, inner_w, 0.8, min_size=8)
    _text(c, ticket_number, left, 47.4, "Helvetica-Bold", stub_tn_size, NAVY, spacing=0.8)

    stub_qr_box, stub_qr = 36, 30
    _draw_qr(c, ticket_number, stub_cx - stub_qr_box / 2, 8, stub_qr_box, stub_qr)
    c.setStrokeColor(MUTED_DARK)
    c.setStrokeAlpha(0.25)
    c.setLineWidth(0.2 * mm)
    c.roundRect((stub_cx - stub_qr_box / 2) * mm, 8 * mm, stub_qr_box * mm, stub_qr_box * mm,
                3 * mm, stroke=1, fill=0)
    c.setStrokeAlpha(1)
    _text(c, "SCAN TO VERIFY", stub_cx, 4.3, "Helvetica-Bold", 5.4, NAVY, spacing=1.6, align="center")

    # --- top tricolour strip across the whole ticket --------------------------
    seg = 180 / 3
    for i, col in enumerate((RED, GOLD, TEAL)):
        c.setFillColor(col)
        c.rect(i * seg * mm, 98.4 * mm, (seg + 0.1) * mm, 1.6 * mm, stroke=0, fill=1)

    c.restoreState()  # end rounded-ticket clip

    # --- tear-off perforation + notches ----------------------------------------
    c.setStrokeColor(MUTED)
    c.setStrokeAlpha(0.7)
    c.setLineWidth(0.3 * mm)
    c.setDash(1.2 * mm, 1.2 * mm)
    c.line(div * mm, 4 * mm, div * mm, 96 * mm)
    c.setDash()
    c.setStrokeAlpha(1)
    c.setFillColor(white)
    c.circle(div * mm, PAGE_H, 3.2 * mm, stroke=0, fill=1)
    c.circle(div * mm, 0, 3.2 * mm, stroke=0, fill=1)

    c.showPage()
    c.save()
    return buffer.getvalue()
