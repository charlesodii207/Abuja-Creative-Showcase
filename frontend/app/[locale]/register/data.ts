// All page content lives here so copy, prices and links can be changed without touching the components.

export const BASE = 'https://africacreativeshowcase.com/register';

// Single registration entry point for the attendee passes.
// TODO: replace with separate links (or a ?tier= parameter) once the form can capture the pass type.
export const ATTENDEE_URL = `${BASE}/attendee/new`;

// Stands, exhibition spaces and fashion slots are booked by phone, not through a form.
export const BOOKING_PHONE = '+234 (0) 906 780 8306';
export const BOOKING_PHONE_HREF = '+2349067808306';

// Call for Creatives: Google Form (replaces the earlier bit.ly link)
export const CALL_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScRIwzwA-551I-C_rLLvZQLwIojNowkJzQZ8fSQW1GeKOhG6Q/viewform?usp=header';

export const CALL_DEADLINE = '25 November 2026';

// ---- Passes ------------------------------------------------------------------------------

export type Tier = {
  id: string;
  name: string;
  price: string;
  /** Small pill beside the name. */
  note: string;
  /** Line under the price. */
  priceNote: string;
  /** Heading above the list. Leave out for none. */
  listLabel?: string;
  /** Every line shown on the card, in order. Edit benefits here. */
  items: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export const tiers: Tier[] = [
  {
    id: 'general',
    name: 'General',
    price: 'Free',
    note: 'Both days',
    priceNote: 'No payment needed',
    listLabel: 'What you get',
    items: [
      'Fashion runway',
      'Film screenings and art exhibitions',
      'Creative Market and networking',
      'Live concert',
      'General seating at the runway and the concert',
      'Masterclasses, both days',
    ],
    cta: 'Get free pass',
    href: ATTENDEE_URL,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '₦100,000',
    note: 'Status pass',
    priceNote: 'One payment, both days',
    items: [
      'Everything in the General pass',
      'Priority seating and treatment at the runway and the concert',
      'Fast-track entry and a dedicated VIP check-in desk',
      'Priority seats at the masterclasses on both days',
      'Priority access to the Creative Market',
    ],
    cta: 'Get VIP',
    href: ATTENDEE_URL,
    featured: true,
  },
];

export const vipNote = 'VIP places are limited.';

/** Paid, not part of either pass. Shown as a strip under the pass cards. */
export const pitchStrip = {
  name: 'Pitch and Deal Room',
  tag: 'Paid',
  price: '₦100,000',
  text: 'Not included in either pass. Selected projects pitch to investors, commissioners, distributors and brands. Selection required.',
  cta: 'Apply to pitch',
  href: `${BASE}/pitcher/new`,
};

// ---- Take part ---------------------------------------------------------------------------

export type Card = {
  name: string;
  /** 'Free' or an amount. Drives the tag colour. */
  price?: string;
  text: string;
  /** Button label. Not used when `phone` is set. */
  cta?: string;
  /** No href = button is shown disabled ("opening soon"). */
  href?: string;
  /** Short status shown beside the price. */
  status?: string;
  /** Set true when the maximum is reached: the button is disabled and reads 'Registration full'. */
  full?: boolean;
  /** Optional. When set, the status reads '12 spaces left'. */
  spacesLeft?: number;
  /** When set, the card shows this number to call instead of a button. */
  phone?: string;
  phoneHref?: string;
};

// Booked by phone. No online form and no button.
export const callCards: Card[] = [
  {
    name: 'Call for vendors and exhibitors',
    text: 'Creative Market stands and art exhibition spaces across both days. Open to anyone with products to sell or art to display, including women-owned businesses.',
    phone: BOOKING_PHONE,
    phoneHref: BOOKING_PHONE_HREF,
  },
  {
    name: 'Fashion showcase',
    text: 'Designers and brands in the fashion industry can present their collection on the runway to an industry audience.',
    phone: BOOKING_PHONE,
    phoneHref: BOOKING_PHONE_HREF,
  },
];

// By application.
export const applyCards: Card[] = [
  { name: 'Investor', price: 'Free', status: 'Registration reviewed', text: 'Meet curated pitching participants and find creative projects worth backing.', cta: 'Register as investor', href: `${BASE}/investor` },
  { name: 'Press', price: 'Free', status: 'Accreditation required', text: 'Interviews, behind-the-scenes access and press briefings.', cta: 'Apply for accreditation', href: `${BASE}/press` },
];

// ---- Campus Creative Challenge -----------------------------------------------------------

export const challenge = {
  name: 'ACS Campus Creative Challenge 2026',
  text: 'Show what you can create and win cash prizes.',
  categories: ['Photography', 'Filmmaking', 'Fashion', 'Graphic Design', 'Fine Art', 'Spoken Word', 'Dance'],
  prizes: [
    { place: '1st prize', amount: '₦100,000' },
    { place: '2nd prize', amount: '₦50,000' },
    { place: '3rd prize', amount: '₦35,000' },
  ],
  href: 'https://docs.google.com/forms/d/e/1FAIpQLSf__udOwo3S8kWim7hrT7ITuWU1h_TaCJpkl9KSb_9CtuH6iw/viewform?usp=dialog',
  // TODO: add the deadline when the client confirms it. It is hidden while empty.
  deadline: undefined as string | undefined,
};

// ---- Call for Creatives ------------------------------------------------------------------

export const calls: Card[] = [
  { name: 'Music and Performing Arts', text: 'Musicians, singers, performers and DJs.', cta: 'Apply now', href: CALL_FORM_URL },
  { name: 'Fashion and Design', text: 'Fashion designers, brands and textile creatives.', cta: 'Apply now', href: CALL_FORM_URL },
  { name: 'Visual Arts and Photography', text: 'Artists, photographers, illustrators and digital creatives.', cta: 'Apply now', href: CALL_FORM_URL },
  { name: 'Film and Screen', text: 'Filmmakers, directors, producers and screen creatives. Submit through FilmFreeway.', cta: 'Apply now', href: 'https://filmfreeway.com/ACS2026' },
];
