"use client";

import {
  DEPARTMENTS,
  SECTIONS,
  coveredByDepartments,
  sectionLabel,
  visibleSectionKeys,
} from "../../../lib/admin/permissions";

const ALWAYS_ON = ["Overview", "Registrants", "Admins"];

function StepHeading({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/60 font-body text-xs text-gold">
        {n}
      </span>
      <div>
        <p className="font-body text-sm text-cream">{title}</p>
        <p className="font-body text-xs text-muted">{hint}</p>
      </div>
    </div>
  );
}

// Departments as cards, single pages as pills, and a live preview of what
// the person will see in their sidebar. Used when creating an admin and when
// editing their access.
export default function AccessPicker({
  departments,
  extras,
  onDepartmentsChange,
  onExtrasChange,
}: {
  departments: string[];
  extras: string[];
  onDepartmentsChange: (next: string[]) => void;
  onExtrasChange: (next: string[]) => void;
}) {
  const covered = coveredByDepartments(departments);
  const visible = visibleSectionKeys(departments, extras);

  function toggleDepartment(key: string) {
    const next = departments.includes(key)
      ? departments.filter((k) => k !== key)
      : [...departments, key];

    onDepartmentsChange(next);

    // A page a department now opens no longer needs to be added on its own.
    const nowCovered = coveredByDepartments(next);
    const trimmed = extras.filter((k) => !nowCovered.has(k));
    if (trimmed.length !== extras.length) onExtrasChange(trimmed);
  }

  function toggleExtra(key: string) {
    onExtrasChange(
      extras.includes(key) ? extras.filter((k) => k !== key) : [...extras, key]
    );
  }

  return (
    <div className="space-y-7">
      {/* Live preview */}
      <div className="rounded-sm border border-ink-raised bg-ink-raised/30 p-4">
        <p className="mb-3 font-body text-xs uppercase tracking-wide text-muted">
          What they'll see
        </p>

        <div className="flex flex-wrap gap-2">
          {ALWAYS_ON.map((label) => (
            <span
              key={label}
              className="rounded-full border border-dashed border-muted/40 px-3 py-1 font-body text-xs text-muted"
            >
              {label}
            </span>
          ))}
          {visible.map((key) => (
            <span
              key={key}
              className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 font-body text-xs text-gold"
            >
              {sectionLabel(key)}
            </span>
          ))}
        </div>

        <p className="mt-3 font-body text-xs text-muted">
          {visible.length === 0
            ? "Only the three basics so far. Pick a department or add single pages below."
            : "Dashed pages are open to every admin."}
        </p>
      </div>

      {/* 1. Departments */}
      <div>
        <StepHeading
          n={1}
          title="Pick departments"
          hint="A department opens a set of pages at once."
        />

        <div className="grid gap-2 sm:grid-cols-2">
          {DEPARTMENTS.map((d) => {
            const on = departments.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleDepartment(d.key)}
                className={`rounded-sm border p-3 text-left transition-colors ${
                  on
                    ? "border-gold bg-gold/10"
                    : "border-ink-raised hover:border-muted/60"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-body text-sm text-cream">{d.label}</span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      on
                        ? "border-gold bg-gold text-ink"
                        : "border-ink-raised text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </span>

                <span className="mt-2 flex flex-wrap gap-1.5">
                  {d.keys.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-ink-raised px-2 py-0.5 font-body text-[11px] text-muted"
                    >
                      {sectionLabel(k)}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Single pages */}
      <div>
        <StepHeading
          n={2}
          title="Add single pages"
          hint="Give one page on its own, without a whole department."
        />

        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((x) => {
            if (covered.has(x.key)) {
              return (
                <span
                  key={x.key}
                  title="Already opened by a department you picked"
                  className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1.5 font-body text-xs text-teal"
                >
                  ✓ {x.label} · included
                </span>
              );
            }

            const on = extras.includes(x.key);
            return (
              <button
                key={x.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggleExtra(x.key)}
                className={`rounded-full border px-3 py-1.5 font-body text-xs transition-colors ${
                  on
                    ? "border-gold bg-gold text-ink"
                    : "border-ink-raised text-muted hover:border-muted/60 hover:text-cream"
                }`}
              >
                {on ? "✓" : "+"} {x.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}