// lib/admin/permissions.ts
//
// Departments are presets of pages for regular admins. Super admins and
// the system owner see everything and don't use departments.
// The backend keeps the same department -> pages mapping (app/permissions.py),
// so if you change one, change the other too.

export type Department = {
  key: string;
  label: string;
  // Page keys this department opens (see SECTIONS below).
  keys: string[];
};

export const DEPARTMENTS: Department[] = [
  {
    key: "messaging_support",
    label: "Messaging & Support",
    keys: ["messages", "live_chat", "event_scan", "event_log"],
  },
  {
    key: "insights_reporting",
    label: "Insights & Reporting",
    keys: ["analytics", "event_scan", "event_log"],
  },
  {
    key: "digital_marketing",
    label: "Digital & Marketing",
    keys: ["traffic", "event_log"],
  },
  {
    key: "hospitality_logistics",
    label: "Hospitality & Logistics",
    keys: ["hotels", "event_log"],
  },
  {
    key: "gate_checkin",
    label: "Gate & Check-in",
    keys: ["event_scan", "event_log"],
  },
];

export function departmentLabel(key: string): string {
  return DEPARTMENTS.find((d) => d.key === key)?.label ?? key;
}

// Individual pages that can be granted on their own, on top of departments.
export const SECTIONS: { key: string; label: string }[] = [
  { key: "messages", label: "Messages" },
  { key: "live_chat", label: "Live chat" },
  { key: "analytics", label: "Analytics" },
  { key: "traffic", label: "Traffic" },
  { key: "event_scan", label: "Event scan" },
  { key: "event_log", label: "Event log" },
  { key: "hotels", label: "Bookings" },
];

export function sectionLabel(key: string): string {
  return SECTIONS.find((x) => x.key === key)?.label ?? key;
}

// Every page key opened by the chosen departments.
export function coveredByDepartments(departments: string[]): Set<string> {
  const covered = new Set<string>();
  DEPARTMENTS.forEach((d) => {
    if (departments.includes(d.key)) d.keys.forEach((k) => covered.add(k));
  });
  return covered;
}

// What a person would see: departments plus single pages, in sidebar order.
export function visibleSectionKeys(departments: string[], extras: string[]): string[] {
  const covered = coveredByDepartments(departments);
  return SECTIONS.map((x) => x.key).filter(
    (k) => covered.has(k) || extras.includes(k)
  );
}