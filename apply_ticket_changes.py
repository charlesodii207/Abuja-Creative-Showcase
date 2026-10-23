#!/usr/bin/env python3
"""
ACS 2026 ticket change: General (free), VIP 50k, Masterclass 100k, VVIP 150k.

Run from the folder that contains `backend` and `frontend`
(C:\\Users\\Hp\\Downloads\\ACS\\abuja-creative-showcase):

    python apply_ticket_changes.py --check     # test only, changes nothing
    python apply_ticket_changes.py             # apply for real

Safety:
  * Every change is checked against your real files FIRST. If even one does
    not match exactly once, NOTHING is written and the script tells you which
    one failed.
  * Originals are copied to ticket_change_backup/ before anything is edited.
  * It also writes the new Alembic migration (adds 'vvip' to the tickettype
    enum), linked to your current latest migration automatically.
"""

import re
import shutil
import sys
from pathlib import Path


def R(pattern, new):
    """Regex change (dot matches newlines). Must match exactly once."""
    return (re.compile(pattern, re.S), new)


EDITS = {}

# ---------------------------------------------------------------------------
# BACKEND
# ---------------------------------------------------------------------------

EDITS["backend/app/models.py"] = [
    R(r'''class TicketType\(str, enum\.Enum\):.*?masterclass = "masterclass"\n''',
      r'''class TicketType(str, enum.Enum):
    # Stored values are unchanged; only the labels people see were renamed:
    #   general     = General      (free, both days)
    #   vip         = VIP          (₦50,000, both days)
    #   masterclass = Masterclass  (₦100,000, both days)
    #   vvip        = VVIP         (₦150,000, both days)
    general = "general"
    vip = "vip"
    masterclass = "masterclass"
    vvip = "vvip"
'''),
]

EDITS["backend/app/utils.py"] = [
    R(r'''      general\s+-> 1-Day Pass[^\n]*\n\s+vip\s+-> 2-Day Pass[^\n]*\n\s+masterclass\s+-> Masterclass[^\n]*\n''',
      r'''      general     -> General      (free, both days)
      vip         -> VIP          (₦50,000, both days)
      masterclass -> Masterclass  (₦100,000, both days)
      vvip        -> VVIP         (₦150,000, both days)
'''),
    R(r'''tier_display = \{[^}]*\}''',
      r'''tier_display = {
            models.TicketType.general: "General",
            models.TicketType.vip: "VIP",
            models.TicketType.masterclass: "Masterclass",
            models.TicketType.vvip: "VVIP",
        }'''),
    R(r'''TICKET_PRICES_KOBO = \{[^}]*\}''',
      r'''TICKET_PRICES_KOBO = {
    TicketType.general: 0,                   # Free. No payment is taken (see routes/attendee.py)
    TicketType.vip: 50_000 * 100,            # ₦50,000, both days, priority seating
    TicketType.masterclass: 100_000 * 100,   # ₦100,000, both days, masterclasses on both days
    TicketType.vvip: 150_000 * 100,          # ₦150,000, both days, everything included
}

# The names people see for each ticket in emails and payment messages. This is
# the single place to rename a ticket; attendee, upgrade and group-order code
# all read from here.
TICKET_LABELS = {
    TicketType.general: "General Pass",
    TicketType.vip: "VIP Pass",
    TicketType.masterclass: "Masterclass Pass",
    TicketType.vvip: "VVIP Pass",
}'''),
    R(r'''tier_order = \[[^\]]*\]''',
      r'''tier_order = [TicketType.general, TicketType.vip, TicketType.masterclass, TicketType.vvip]'''),
]

EDITS["backend/app/routes/tickets.py"] = [
    R(r'''def _is_day_pass\(registrant: models\.Registrant\) -> bool:.*?return detail is not None and detail\.ticket_type == models\.TicketType\.general\n''',
      r'''def _is_day_pass(registrant: models.Registrant) -> bool:
    """
    Always False now. Every ticket (General, VIP, Masterclass, VVIP) is valid
    on both event days, with one accepted entry per ticket per day, which the
    "already arrived today" check above already enforces. The old single-day
    pass rule further down is kept switched off rather than deleted, so it can
    be removed in a later clean-up.
    """
    return False
'''),
]

EDITS["backend/app/routes/attendee.py"] = [
    R(r'''# The stored ticket types are unchanged \(general / vip / masterclass\); only\n# the names people see changed, including in the payment email\.\nTICKET_LABELS = \{[^}]*\}''',
      r'''# Ticket names live in one place (utils.TICKET_LABELS).
TICKET_LABELS = utils.TICKET_LABELS'''),
    R(r'''from app\.kora import initialize_transaction, KoraError''',
      r'''from app.kora import initialize_transaction, KoraError
from app.tickets import issue_ticket_and_email'''),
    R(r'''    db\.add\(attendee_detail\)\n\s*callback_url = \(''',
      r'''    db.add(attendee_detail)

    # Free ticket (General): there is nothing to pay, so skip Kora and the
    # "payment required" email. The person is confirmed straight away, marked
    # as paid (so the door scanner and the upgrade page treat it like any
    # other ticket), and their ticket is emailed immediately.
    if amount_kobo == 0:
        registrant.status = models.RegistrantStatus.confirmed
        attendee_detail.is_paid = True
        db.commit()
        db.refresh(registrant)

        issue_ticket_and_email(db, registrant)

        return schemas.RegistrationResponse(
            reference_number=reference_number,
            message="You're registered. Your free ticket has been sent to your email.",
            amount_kobo=0,
            paystack_authorization_url=None,
        )

    callback_url = ('''),
    R(r'''description=f"\{TICKET_LABELS\[payload\.ticket_type\]\} ticket",''',
      r'''description=f"{TICKET_LABELS[payload.ticket_type]}",'''),
]

EDITS["backend/app/routes/upgrade.py"] = [
    R(r'''# The stored ticket types are unchanged \(general / vip / masterclass\); only\n# the names people see changed, including in the payment email\.\nTICKET_LABELS = \{[^}]*\}''',
      r'''# Ticket names live in one place (utils.TICKET_LABELS).
TICKET_LABELS = utils.TICKET_LABELS'''),
]

EDITS["backend/app/routes/attendee_status.py"] = [
    R(r'''    resume_reference = utils\.generate_resume_reference\(''',
      r'''    # Free tickets are confirmed at sign-up and never need payment; this also
    # stops an empty or zero amount from ever being sent to Kora.
    if detail.amount_kobo is None or detail.amount_kobo <= 0:
        raise HTTPException(
            status_code=400,
            detail="No payment is needed for this registration.",
        )

    resume_reference = utils.generate_resume_reference('''),
    R(r'''"Payment confirmed\. Your ticket has been sent to your email\."''',
      r'''"Your registration is confirmed. Your ticket has been sent to your email."'''),
]

EDITS["backend/app/routes/group_orders.py"] = [
    R(r'''scanner, scan log and 1-Day Pass rule work for every ticket unchanged\.''',
      r'''scanner and scan log work for every ticket unchanged.'''),
    R(r'''TYPE_LABELS = \{[^}]*\}''',
      r'''TYPE_LABELS = utils.TICKET_LABELS'''),
    R(r'''        one_day_note = ""\n        if order\.ticket_type == models\.TicketType\.general\.value:\n            one_day_note = \(.*?\n            \)\n\n''',
      r''''''),
    R(r'''            \{one_day_note\}\n''',
      r''''''),
    R(r'''        one_day_pass=\(order\.ticket_type == models\.TicketType\.general\.value\),\n''',
      r''''''),
    R(r'''for t in \(models\.TicketType\.general, models\.TicketType\.vip, models\.TicketType\.masterclass\)''',
      r'''for t in (models.TicketType.vip, models.TicketType.masterclass, models.TicketType.vvip)'''),
    R(r'''    unit = utils\.get_attendee_amount_kobo\(payload\.ticket_type\)\n''',
      r'''    # General tickets are free, so there is nothing to pay for. Group orders
    # are for paid tickets only; each person can register a free ticket on the
    # attendee page.
    if payload.ticket_type == models.TicketType.general:
        raise HTTPException(
            status_code=400,
            detail=(
                "General tickets are free, so they can't be bought as a group. "
                "Each person can register for a free ticket on the attendee page."
            ),
        )

    unit = utils.get_attendee_amount_kobo(payload.ticket_type)
'''),
]

EDITS["backend/app/ticket_pdf.py"] = [
    R(r'''# The 1-Day Pass is admitted once, so it must not say "each day"\.\nCHECKIN_NOTE_ONE_DAY = \(.*?\)\nONE_DAY_LABEL = "1-DAY PASS"\n''',
      r'''# How each ticket type is written in the ACCESS box (str.title() would turn
# "VIP ACCESS" into "Vip Access").
ACCESS_DISPLAY = {
    "GENERAL ACCESS": "General Access",
    "VIP ACCESS": "VIP Access",
    "MASTERCLASS ACCESS": "Masterclass Access",
    "VVIP ACCESS": "VVIP Access",
}
'''),
    R(r'''# 1-Day/2-Day/Masterclass/Exhibitor/Pitcher are distinguishable at a''',
      r'''# General/VIP/Masterclass/VVIP/Exhibitor/Pitcher are distinguishable at a'''),
    R(r'''    "1-DAY PASS": \(TEAL, GOLD\),\n    "2-DAY PASS": \(GOLD, RED\),\n    "MASTERCLASS ACCESS": \(RED, GOLD\),\n''',
      r'''    "GENERAL ACCESS": (TEAL, TEAL),
    "VIP ACCESS": (GOLD, RED),
    "MASTERCLASS ACCESS": (RED, GOLD),
    "VVIP ACCESS": (GOLD, CREAM),
'''),
    R(r'''      general\s+-> 1-DAY PASS[^\n]*\n\s+vip\s+-> 2-DAY PASS[^\n]*\n\s+masterclass\s+-> MASTERCLASS ACCESS[^\n]*\n''',
      r'''      general     -> GENERAL ACCESS
      vip         -> VIP ACCESS
      masterclass -> MASTERCLASS ACCESS
      vvip        -> VVIP ACCESS
'''),
    R(r'''\("1-DAY PASS", "ATTENDEE"\)''',
      r'''("VIP ACCESS", "ATTENDEE")'''),
    R(r'''label = \{[^}]*\}\[tier\]''',
      r'''label = {
            models.TicketType.general: "GENERAL ACCESS",
            models.TicketType.vip: "VIP ACCESS",
            models.TicketType.masterclass: "MASTERCLASS ACCESS",
            models.TicketType.vvip: "VVIP ACCESS",
        }[tier]'''),
    R(r'''    note = CHECKIN_NOTE_ONE_DAY if ticket_label\.upper\(\) == ONE_DAY_LABEL else CHECKIN_NOTE\n''',
      r'''    note = CHECKIN_NOTE
'''),
    R(r'''access_display = ticket_label\.title\(\)''',
      r'''access_display = ACCESS_DISPLAY.get(ticket_label.upper(), ticket_label.title())'''),
]

EDITS["backend/app/tickets.py"] = [
    R(r'''        # The 1-Day Pass admits once, so its email says so \(and how to upgrade\)\.\n        one_day_pass=\(ticket_label\.upper\(\) == ticket_pdf\.ONE_DAY_LABEL\),\n''',
      r''''''),
    R(r'''new_tier_label=ticket_label\.title\(\),''',
      r'''new_tier_label=ticket_pdf.ACCESS_DISPLAY.get(ticket_label.upper(), ticket_label.title()),'''),
]

EDITS["backend/app/emailer.py"] = [
    R(r'''    one_day_pass: bool = False,\n''',
      r''''''),
    R(r'''\n    When one_day_pass is True.*?    html = f"""\n''',
      r'''    """
    html = f"""
'''),
    R(r'''    \{one_day_note\}\n\n''',
      r'''    <p>
        Your pass is valid on both days of the Showcase, 4 and 5 December
        2026.
    </p>

'''),
]

# ---------------------------------------------------------------------------
# FRONTEND
# ---------------------------------------------------------------------------

EDITS["frontend/app/register/attendee/page.tsx"] = [
    R(r'''function Price\(\{ label, amount \}: \{ label: string; amount: string \}\) \{.*?\n\}\n''',
      r'''function Price({ label, amount }: { label: string; amount: string }) {
  const isFree = amount === "Free";

  return (
    <span className="whitespace-nowrap">
      {label}{" "}
      {!isFree && (
        <span className="line-through decoration-2 decoration-[#E59200]/70">
          ₦
        </span>
      )}
      {amount}
    </span>
  );
}
'''),
    R(r'''<Price label="1-Day Pass" amount="10,000" />.*?<Price label="Masterclass" amount="50,000" />''',
      r'''<Price label="General" amount="Free" />
                {" · "}
                <Price label="VIP" amount="50,000" />
                {" · "}
                <Price label="Masterclass" amount="100,000" />
                {" · "}
                <Price label="VVIP" amount="150,000" />'''),
]

EDITS["frontend/app/register/attendee/new/page.tsx"] = [
    R(r'''// The values below are what the backend stores \(general / vip / masterclass\)\..*?type TicketType = "general" \| "vip" \| "masterclass";\n''',
      r'''// The values below are what the backend stores (general / vip / masterclass /
// vvip). The names people see:
//   general -> General (free)   vip -> VIP   masterclass -> Masterclass   vvip -> VVIP
type TicketType = "general" | "vip" | "masterclass" | "vvip";
'''),
    R(r'''const TIERS: \{.*?\n\];\n''',
      r'''const TIERS: {
  value: TicketType;
  label: string;
  price: string;
  blurb: string;
}[] = [
  {
    value: "general",
    label: "General",
    price: "Free",
    blurb:
      "Free entry on both days, 4 and 5 December: fashion runway, film screenings and art, the Creative Market, and the live concert. General seating.",
  },
  {
    value: "vip",
    label: "VIP",
    price: "₦50,000",
    blurb:
      "Everything in General, with priority seating at the runway and the concert.",
  },
  {
    value: "masterclass",
    label: "Masterclass",
    price: "₦100,000",
    blurb:
      "Everything in General, plus the masterclasses on both days. General seating.",
  },
  {
    value: "vvip",
    label: "VVIP",
    price: "₦150,000",
    blurb:
      "Everything included: front reserved seating, a reserved table at the concert and dinner, meet and greet, masterclasses on both days, and Pitch and Deal Room access.",
  },
];
'''),
    R(r'''  const \[accepted, setAccepted\] = useState\(false\);\n''',
      r'''  const [accepted, setAccepted] = useState(false);

  // The reason the server gave when registration fails (if it gave one).
  const [errorMessage, setErrorMessage] = useState("");
'''),
    R(r'''throw new Error\(data\?\.detail \|\| "Registration failed"\);''',
      r'''throw new Error(
          typeof data?.detail === "string" ? data.detail : "Registration failed"
        );'''),
    R(r'''    \} catch \{\n      setStatus\("error"\);\n    \}''',
      r'''    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : ""
      );
      setStatus("error");
    }'''),
    R(r'''const amountNaira = \(confirmation\.amount_kobo / 100\)\.toLocaleString\(\);''',
      r'''const amountNaira = (confirmation.amount_kobo / 100).toLocaleString();
    // A free ticket has nothing to pay: it is confirmed and emailed at once.
    const isFree = confirmation.amount_kobo === 0;'''),
    R(r'''Registration Received''',
      r'''{isFree ? "You're registered" : "Registration Received"}'''),
    R(r'''Finish Your Registration''',
      r'''{isFree ? "Your Free Ticket Is on Its Way" : "Finish Your Registration"}'''),
    R(r'''Your registration has been received and your place has been\n\s+reserved\.''',
      r'''{isFree
                    ? "Your registration is confirmed. We have emailed your free ticket."
                    : "Your registration has been received and your place has been reserved."}'''),
    R(r'''Amount Due''',
      r'''{isFree ? "Price" : "Amount Due"}'''),
    R(r'''₦\{amountNaira\}''',
      r'''{isFree ? "Free" : `₦${amountNaira}`}'''),
    R(r'''Check your email for your reference number\. Keep it safe —\n\s+you&apos;ll need it to finish your registration and\n\s+complete payment\.''',
      r'''{isFree
                      ? "Your ticket is attached to the email we sent. Show it at check-in on either day."
                      : "Check your email for your reference number. Keep it safe — you'll need it to finish your registration and complete payment."}'''),
    R(r'''                <div className="mt-8">\n                  <Link\n                    href="/verify"\n''',
      r'''                <div className="mt-8">
                  {isFree ? (
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)]"
                    >
                      Back to homepage
                    </Link>
                  ) : (
                  <Link
                    href="/verify"
'''),
    R(r'''(<span className="ml-3">→</span>\n\s+</Link>\n)(\s+</div>)''',
      lambda m: m.group(1) + "                  )}\n" + m.group(2)),
    R(r''': "Complete Registration →"\}''',
      r''': selectedTier.value === "general"
                    ? "Get my free ticket →"
                    : "Complete Registration →"}'''),
    R(r'''Something went wrong — please check your details and try\n\s+again\.''',
      r'''{errorMessage ||
                        "Something went wrong — please check your details and try again."}'''),
]

EDITS["frontend/app/register/attendee/finish/page.tsx"] = [
    R(r'''const TICKET_LABELS: Record<string, string> = \{[^}]*\};''',
      r'''const TICKET_LABELS: Record<string, string> = {
  general: "General",
  vip: "VIP",
  masterclass: "Masterclass",
  vvip: "VVIP",
};

// Ticket prices in naira (General is free). Used to show what an upgrade costs.
const PRICES: Record<string, number> = {
  general: 0,
  vip: 50000,
  masterclass: 100000,
  vvip: 150000,
};'''),
    R(r'''const UPGRADE_OPTIONS: Record<\s*string,\s*\{ value: string; label: string \}\[\]\s*> = \{.*?\n\};''',
      r'''const UPGRADE_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  general: [
    { value: "vip", label: "VIP" },
    { value: "masterclass", label: "Masterclass" },
    { value: "vvip", label: "VVIP" },
  ],
  vip: [
    { value: "masterclass", label: "Masterclass" },
    { value: "vvip", label: "VVIP" },
  ],
  masterclass: [{ value: "vvip", label: "VVIP" }],
  vvip: [],
};'''),
    R(r'''<option key=\{opt\.value\} value=\{opt\.value\}>\s*\{opt\.label\}\s*</option>''',
      r'''<option key={opt.value} value={opt.value}>
                      {`${opt.label} (pay ₦${(
                        (PRICES[opt.value] ?? 0) - (PRICES[ticketType] ?? 0)
                      ).toLocaleString()})`}
                    </option>'''),
    R(r'''A new ticket will be emailed once''',
      r'''An updated ticket will be emailed once'''),
    R(r''': "Upgrade & Pay Difference"\}''',
      r''': "Upgrade & Pay"}'''),
]

EDITS["frontend/app/verify/page.tsx"] = [
    R(r'''Your registration and payment have been successfully\n\s+confirmed\.''',
      r'''Your registration has been successfully
                  confirmed.'''),
]

EDITS["frontend/app/group/page.tsx"] = [
    R(r'''setTicketType\] = useState\("general"\)''',
      r'''setTicketType] = useState("vip")'''),
]

EDITS["frontend/lib/content.ts"] = [
    R(r'''a: "Tickets are ₦10,000 for a single day or ₦15,000 for both days\..*?on Day 2\.",''',
      r'''a: "General entry is free and covers both days. VIP is ₦50,000 with priority seating, the Masterclass Pass is ₦100,000 and includes the masterclasses on both days, and VVIP is ₦150,000 and includes everything: front reserved seating, a reserved table at the concert and dinner, a meet and greet, the masterclasses, and Pitch and Deal Room access.",'''),
    R(r'''"Choose a 1-day ticket, a 2-day ticket, or the Masterclass Pass, which covers both days including the main masterclass sessions\.",''',
      r'''"Start with a free General pass, or choose VIP, the Masterclass Pass or VVIP. Every pass covers both days.",'''),
]

# ---------------------------------------------------------------------------
# MIGRATION (adds 'vvip' to the tickettype enum)
# ---------------------------------------------------------------------------

NEW_REVISION = "c3d9a5e7b2f1"
MIGRATION_NAME = f"{NEW_REVISION}_add_vvip_ticket_tier.py"

MIGRATION_TEMPLATE = '''"""add vvip ticket tier

Revision ID: {rev}
Revises: {down}
Create Date: 2026-10-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '{rev}'
down_revision: Union[str, Sequence[str], None] = '{down}'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # New top ticket tier. This one statement covers every column that uses
    # the tickettype enum (attendee_details.ticket_type and
    # attendee_details.pending_upgrade_ticket_type).
    op.execute("ALTER TYPE tickettype ADD VALUE IF NOT EXISTS 'vvip'")


def downgrade() -> None:
    """Downgrade schema."""

    # Postgres cannot remove a single value from an enum type, so 'vvip'
    # stays on tickettype (same as the 'masterclass' migration).
    pass
'''


def find_head(versions_dir: Path):
    rev_re = re.compile(r'''^revision\s*(?::[^=\n]+)?=\s*['"]([^'"]+)['"]''', re.M)
    down_re = re.compile(r'''^down_revision\s*(?::[^=\n]+)?=\s*(.+)$''', re.M)
    revs, downs = set(), set()
    for f in versions_dir.glob("*.py"):
        text = f.read_text(encoding="utf-8", errors="replace")
        m = rev_re.search(text)
        if not m:
            continue
        revs.add(m.group(1))
        d = down_re.search(text)
        if d:
            downs.update(re.findall(r'''['"]([^'"]+)['"]''', d.group(1)))
    return revs, sorted(revs - downs)


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def main():
    check_only = "--check" in sys.argv

    root = Path.cwd()
    if not (root / "backend").exists() and (root / "abuja-creative-showcase" / "backend").exists():
        root = root / "abuja-creative-showcase"
    if not (root / "backend").exists() or not (root / "frontend").exists():
        print("Run this from the folder that contains 'backend' and 'frontend'.")
        sys.exit(1)

    errors = []
    new_texts = {}
    crlf = {}

    for rel, edits in EDITS.items():
        path = root / rel
        if not path.exists():
            errors.append(f"{rel}: file not found")
            continue
        raw = path.read_bytes().decode("utf-8-sig")
        crlf[rel] = "\r\n" in raw
        text = raw.replace("\r\n", "\n")

        for i, (rx, new) in enumerate(edits, start=1):
            found = list(rx.finditer(text))
            if len(found) != 1:
                preview = rx.pattern[:70].replace("\n", " ")
                errors.append(
                    f"{rel}: change {i} matched {len(found)} times (needs exactly 1): {preview}..."
                )
                continue
            text = rx.sub((lambda m, n=new: n(m) if callable(n) else n), text, count=1)
        new_texts[rel] = text

    versions = root / "backend" / "alembic" / "versions"
    head = None
    migration_exists = False
    if not versions.exists():
        errors.append("backend/alembic/versions: folder not found")
    else:
        revs, heads = find_head(versions)
        if NEW_REVISION in revs:
            migration_exists = True
        elif len(heads) != 1:
            errors.append(
                f"alembic: expected exactly one latest migration, found {heads or 'none'}. "
                "Run 'alembic heads' and send me the output."
            )
        else:
            head = heads[0]

    if errors:
        print("NOTHING WAS CHANGED. These problems need fixing first:\n")
        for e in errors:
            print("  - " + e)
        print("\n(If it says a change matched 0 times and you already ran this once, "
              "it was probably applied already.)")
        sys.exit(1)

    print(f"All {sum(len(v) for v in EDITS.values())} changes in {len(EDITS)} files match.")
    print(f"Latest migration: {head or '(new migration already present)'}")

    if check_only:
        print("\nCheck only: no files were changed.")
        return

    backup = root / "ticket_change_backup"
    for rel in EDITS:
        src = root / rel
        dst = backup / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    for rel, text in new_texts.items():
        out = text.replace("\n", "\r\n") if crlf[rel] else text
        (root / rel).write_bytes(out.encode("utf-8"))
        print(f"  updated  {rel}")

    if head and not migration_exists:
        mig = versions / MIGRATION_NAME
        mig.write_text(MIGRATION_TEMPLATE.format(rev=NEW_REVISION, down=head), encoding="utf-8")
        print(f"  created  backend/alembic/versions/{MIGRATION_NAME}")

    print(f"\nDone. Originals are saved in: {backup}")


if __name__ == "__main__":
    main()
