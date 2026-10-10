// lib/admin/signoffs.ts
//
// Suggested greeting and sign-off for emails written in the dashboard.
// These are only SUGGESTIONS: the person clicks a button, the text lands in
// the message box, and they can edit it freely.

const DEFAULT_SIGNOFF = "Best regards,\nAfriqa Creative Showcase";

// Mailboxes that sign off with a named person. Everything else uses the default.
const SIGNOFFS: Record<string, string> = {
  director: "Best regards,\nEbere Ojadua\nDirector, Afriqa Creative Showcase",
  convener: "Best regards,\nPaulgold Olalekan Joseph\nConvener, Afriqa Creative Showcase",
};

export function signoffFor(mailboxKey?: string | null): string {
  return (mailboxKey && SIGNOFFS[mailboxKey]) || DEFAULT_SIGNOFF;
}

export function firstName(fullName?: string | null): string {
  const first = (fullName || "").trim().split(/\s+/)[0] || "";
  if (!first || first.includes("@")) return "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// Contact-form people are greeted by first name; everyone else gets "Hello,".
export function greetingFor(opts: { channel?: string | null; name?: string | null }): string {
  if (opts.channel !== "email") {
    const first = firstName(opts.name);
    if (first) return `Hello ${first},`;
  }
  return "Hello,";
}

// Squeezes 3+ line breaks into one blank line and trims the ends.
export function tidyBody(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Greeting, one blank line, the message, one blank line, sign-off.
// With an empty message it leaves exactly one blank line to type in.
export function applySuggestion(body: string, greeting: string, signoff: string): string {
  const text = tidyBody(body);
  return text
    ? `${greeting}\n\n${text}\n\n${signoff}`
    : `${greeting}\n\n\n${signoff}`;
}

export function removeSuggestion(body: string, greeting: string, signoff: string): string {
  let out = body.replace(/\r/g, "");
  if (out.startsWith(greeting)) out = out.slice(greeting.length);
  out = out.trimEnd();
  if (out.endsWith(signoff)) out = out.slice(0, -signoff.length);
  return tidyBody(out);
}