#!/usr/bin/env python3
"""
PART 2 of the ACS 2026 ticket change (only the 11 changes that were not
in the first run: payment screen straight after registering). General (free), VIP 50k, Masterclass 100k, VVIP 150k.

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


EDITS = {
    "frontend/app/register/attendee/new/page.tsx": [
        R('      setConfirmation\\(\\{\\s*amount_kobo: data\\.amount_kobo,\\s*email: form\\.email,\\s*\\}\\);\\n',
          '      // Paid tickets go straight to the payment screen (online or bank\n      // transfer): no email step in between. (The payment link is still\n      // emailed as a backup.) Free tickets have no payment link, so they\n      // fall through to the confirmation screen below.\n      if (data.paystack_authorization_url && data.reference_number) {\n        window.location.href = `/verify?ref=${encodeURIComponent(\n          data.reference_number\n        )}&pay=1`;\n        return;\n      }\n\n      setConfirmation({\n        amount_kobo: data.amount_kobo,\n        email: form.email,\n      });\n'),
        R('After registration, check your email for your reference\\n\\s+number and continue through verification\\.',
          'After registration, you will choose how to pay: online or by bank\n                  transfer. Your reference number is also emailed to you.'),
    ],
    "frontend/app/verify/page.tsx": [
        R('  const rawRef = searchParams\\.get\\("ref"\\)\\?\\.trim\\(\\) \\|\\| "";\\n',
          '  const rawRef = searchParams.get("ref")?.trim() || "";\n  const wantsToPay = searchParams.get("pay") === "1";\n'),
        R('        await loadStatus\\(reference\\);\\n\\n        if \\(cancelled\\) return;\\n\\n        setPageState\\("ready"\\);',
          '        const loaded = await loadStatus(reference);\n\n        if (cancelled) return;\n\n        // Just registered: go straight to "how would you like to pay?".\n        if (wantsToPay && loaded?.action === "payment_required") {\n          setPageState("choose");\n          return;\n        }\n\n        setPageState("ready");'),
        R('\\}, \\[reference, paymentReference\\]\\);',
          '}, [reference, paymentReference, wantsToPay]);'),
    ],
}

# Files found by what is inside them (so the exact folder doesn't matter).
FIND_BY_CONTENT = [
    (
        'frontend/app/register/exhibitor/**/page.tsx',
        'function ExhibitorRegistrationForm',
        [
            R('      setConfirmation\\(\\{\\s*amount_kobo: data\\.amount_kobo,\\s*email: form\\.email,\\s*\\}\\);\\n',
              '      // Go straight to the payment screen (online or bank transfer): no\n      // email step in between. (The payment link is still emailed as a\n      // backup.) If the server did not send a payment link, fall through to\n      // the confirmation screen below.\n      if (data.paystack_authorization_url && data.reference_number) {\n        window.location.href = `/verify?ref=${encodeURIComponent(\n          data.reference_number\n        )}&pay=1`;\n        return;\n      }\n\n      setConfirmation({\n        amount_kobo: data.amount_kobo,\n        email: form.email,\n      });\n'),
            R('After submitting your registration, check your email for\\n\\s+your reference number and continue through verification\\.',
              'After you submit, you will choose how to pay: online or by bank\n                  transfer. Your reference number is also emailed to you.'),
            R('\\? "Submitting\\.\\.\\."',
              '? "Please wait..."'),
        ],
    ),
    (
        'frontend/app/register/pitcher/**/page.tsx',
        'function PitcherRegistrationPage',
        [
            R('      setPayment\\(\\{\\s*amount_kobo: data\\.amount_kobo,\\s*\\}\\);\\n',
              '      // Go straight to the payment screen (online or bank transfer): no\n      // email step in between. (The payment link is still emailed as a\n      // backup.) If the server did not send a payment link, fall through to\n      // the confirmation screen below.\n      if (data.paystack_authorization_url && data.reference_number) {\n        window.location.href = `/verify?ref=${encodeURIComponent(\n          data.reference_number\n        )}&pay=1`;\n        return;\n      }\n\n      setPayment({\n        amount_kobo: data.amount_kobo,\n      });\n'),
            R('After submitting your registration, check your email for\\n\\s+your reference number and continue through verification\\.',
              'After you submit, you will choose how to pay: online or by bank\n                  transfer. Your reference number is also emailed to you.'),
            R('\\? "Submitting\\.\\.\\."',
              '? "Please wait..."'),
        ],
    ),
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

    for pattern, must_contain, edits in FIND_BY_CONTENT:
        hits = [
            p for p in root.glob(pattern)
            if must_contain in p.read_bytes().decode("utf-8-sig", errors="replace")
        ]
        if len(hits) != 1:
            errors.append(
                f"{pattern}: expected exactly 1 file containing '{must_contain}', found {len(hits)}"
            )
        else:
            EDITS[hits[0].relative_to(root).as_posix()] = edits

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

    backup = root / "ticket_change_backup_part2"
    for rel in EDITS:
        src = root / rel
        dst = backup / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    # Write everything first and print afterwards, so a problem with the
    # screen output can never leave the project half-patched.
    done = []
    for rel, text in new_texts.items():
        out = text.replace("\n", "\r\n") if crlf[rel] else text
        (root / rel).write_bytes(out.encode("utf-8"))
        done.append(f"  updated  {rel}")

    if head and not migration_exists:
        mig = versions / MIGRATION_NAME
        mig.write_text(MIGRATION_TEMPLATE.format(rev=NEW_REVISION, down=head), encoding="utf-8")
        done.append(f"  created  backend/alembic/versions/{MIGRATION_NAME}")

    for line in done:
        print(line)
    print(f"\nDone. Originals are saved in: {backup}")


if __name__ == "__main__":
    main()