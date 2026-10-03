// lib/admin/permissions.ts
//
// Departments are presets of sections for regular admins. Super admins and
// the system owner see everything and don't use departments.
// The backend keeps the same department -> sections mapping, so if you
// change one, change the other too.

export type Department = {
  key: string;
  label: string;
  sections: string;
};

export const DEPARTMENTS: Department[] = [
  {
    key: "messaging_support",
    label: "Messaging & Support",
    sections: "Messages, Live chat, Event scan, Event log",
  },
  {
    key: "insights_reporting",
    label: "Insights & Reporting",
    sections: "Analytics, Event scan, Event log",
  },
  {
    key: "digital_marketing",
    label: "Digital & Marketing",
    sections: "Traffic, Event log",
  },
  {
    key: "hospitality_logistics",
    label: "Hospitality & Logistics",
    sections: "Hotels & bookings, Event log",
  },
  {
    key: "gate_checkin",
    label: "Gate & Check-in",
    sections: "Event scan, Event log",
  },
];

export function departmentLabel(key: string): string {
  return DEPARTMENTS.find((d) => d.key === key)?.label ?? key;
}