"""Makes the exhibitor pages remember the booth / runway chosen on /register.
Run from the project folder (the one with backend and frontend inside):
  py apply_exhibitor_links.py --check    (tests only, changes nothing)
  py apply_exhibitor_links.py            (applies; keeps .bak copies)
"""
import sys, pathlib, shutil

ROOT = pathlib.Path(__file__).parent
LAND = ROOT / "frontend/app/register/exhibitor/page.tsx"
NEW = ROOT / "frontend/app/register/exhibitor/new/page.tsx"

LAND_EDITS = [
("export default function ExhibitorRegisterPage() {\n",
'''export default async function ExhibitorRegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string | string[]; size?: string | string[] }>;
}) {
  // A choice made on /register arrives as ?type=booth&size=small (or ?type=fashion_runway).
  const sp = (await searchParams) ?? {};
  const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const type = one(sp.type);
  const size = one(sp.size);
  const qs = new URLSearchParams();
  if (type === "booth" || type === "fashion_runway") qs.set("type", type);
  if (type === "booth" && (size === "small" || size === "big")) qs.set("size", size);
  const newHref = qs.toString()
    ? `/register/exhibitor/new?${qs.toString()}`
    : "/register/exhibitor/new";

'''),
('href="/register/exhibitor/new"', 'href={newHref}'),
]

NEW_EDITS = [
('import { useState } from "react";\nimport Link from "next/link";\n',
 'import { Suspense, useState } from "react";\nimport Link from "next/link";\nimport { useSearchParams } from "next/navigation";\n'),
("export default function ExhibitorRegistrationPage() {\n  const [exhibitType, setExhibitType] = useState<ExhibitType | null>(null);\n",
'''function ExhibitorRegistrationForm() {
  // A choice made on /register arrives as ?type=booth&size=small (or ?type=fashion_runway).
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const sizeParam = searchParams.get("size");
  const startType: ExhibitType | null =
    typeParam === "booth" || typeParam === "fashion_runway" ? typeParam : null;
  const startSize: BoothSize | "" =
    startType === "booth" && (sizeParam === "small" || sizeParam === "big")
      ? sizeParam
      : "";

  const [exhibitType, setExhibitType] = useState<ExhibitType | null>(startType);
'''),
('    booth_size: "" as BoothSize | "",\n', '    booth_size: startSize as BoothSize | "",\n'),
]

NEW_APPEND = '''
// useSearchParams needs a Suspense boundary so the page can still be built.
export default function ExhibitorRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <ExhibitorRegistrationForm />
    </Suspense>
  );
}
'''

def load(p):
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    return raw.replace("\r\n", "\n"), crlf

def main():
    check = "--check" in sys.argv
    plan, bad = [], 0
    for path, edits, append in [(LAND, LAND_EDITS, ""), (NEW, NEW_EDITS, NEW_APPEND)]:
        if not path.exists():
            print("MISSING FILE:", path); bad += 1; continue
        text, crlf = load(path)
        if "useSearchParams" in text or "newHref" in text:
            print("Already applied:", path.name); continue
        for old, new in edits:
            if text.count(old) != 1:
                print("NO MATCH in", path, "->", old[:60].replace("\n", " ")); bad += 1
            else:
                text = text.replace(old, new)
        text += append
        plan.append((path, text, crlf))
    if bad:
        print("\nNothing changed. Paste this message back to me."); return
    if check:
        print("All edits match. Check only: no files were changed."); return
    for path, text, crlf in plan:
        shutil.copy(path, str(path) + ".bak")
        path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
        print("updated", path)
    print("Done. Originals saved next to each file as page.tsx.bak")

main()