// Both legal pages read from this one file.

export const legal = {
  eventName: "Afriqa Creative Showcase 2026",
  siteName: "Afriqa Creative Showcase",
  organizer: "AFRIGOS Film & Media Academy",
  website: "https://africacreativeshowcase.com",
  eventDates: "4 and 5 December 2026",
  venue: "Old Parade Ground, Abuja, FCT, Nigeria",

  // AFRIGOS CAC registration number. Set to "" to leave it out of the pages.
  registrationNumber: "RC 1255262",
  address: "2nd Floor, Wing A, Bassan Plaza, 759 Constitution Avenue (Independence Avenue), Central Business District, Abuja, Federal Capital Territory, Nigeria",
  contactEmail: "info@afrigos.com",
  privacyEmail: "info@afrigos.com",
  phone: "+234 803 776 1265",
  effectiveDate: "1 October 2026",
  lastUpdated: "1 October 2026",
  legalVersion: "1.0",
};

// Used in the legal pages. Empty until registrationNumber is filled in.
export const registrationNote = legal.registrationNumber
  ? ` (registration number ${legal.registrationNumber})`
  : "";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};