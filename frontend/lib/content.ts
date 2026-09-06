// All editable event copy lives here. Update dates, venue, and text
// in this one file rather than hunting through components.

export const event = {
  name: "Abuja Creative Showcase",
  shortName: "ACS",
  tagline: "Where Creativity Meets Opportunity",
  dates: "Dates to be announced", // swap for a real date once confirmed
  venue: "Venue to be announced, Abuja, FCT",
  organizer: "AFRIGOS Film & Media Academy",
};

// TEMPORARY: ACS doesn't have its own social accounts yet.
// These point to AFRIGOS's accounts as a placeholder — swap once ACS's
// own accounts exist.
export const socials = [
  { name: "TikTok", url: "https://www.tiktok.com/@afrigosfilmacademy", icon: "tiktok" as const },
  { name: "Facebook", url: "https://www.facebook.com/share/1G2B8acP4D/?mibextid=wwXIfr", icon: "facebook" as const },
  { name: "Instagram", url: "https://www.instagram.com/afrigosfilmschool/", icon: "instagram" as const },
];

export const about = {
  heading: "A meeting point for talent and opportunity",
  body: [
    "Abuja's creative community spans film, music, fashion, photography, publishing, theatre, visual arts, gaming, and technology — but the ecosystem is fragmented. Talent is here. Connection to capital, markets, and decision-makers often isn't.",
    "Abuja Creative Showcase brings the two together over two days: creative markets, screenings, live performances, industry conversations, masterclasses, a finance forum, and a pitching room, all in one space.",
  ],
};

export const aboutExtended = [
  "Abuja is home to one of Nigeria's most dynamic creative communities — filmmakers, musicians, fashion designers, photographers, publishers, theatre practitioners, visual artists, game developers, and digital creators, all working within the nation's capital. Yet despite this depth of talent, the ecosystem remains fragmented. Creatives often work in isolation from one another, opportunities are scattered across disconnected channels, access to finance is limited, and market connections are weak. Many emerging talents never get in front of the commissioners, investors, distributors, and brands capable of turning a creative idea into a sustainable business.",
  "Abuja Creative Showcase (ACS) exists to close that gap. It is conceived as a two-day, high-impact platform that brings the capital's creative ecosystem into one dynamic space — combining a creative market, film and television screenings, live performances, industry conversations, masterclasses, a finance forum, a pitching room, and structured networking, all under one roof. Rather than functioning as a conventional festival, ACS is designed as a working marketplace: a place where a filmmaker can meet a distributor, a musician can meet a brand, a fashion designer can meet a buyer, and an emerging creative can discover an opportunity that didn't exist for them yesterday.",
  "The philosophy behind ACS is simple: talent should not only be seen, it should be connected to opportunity. Abuja carries a unique advantage here. As Nigeria's capital, it is home to government institutions, diplomatic missions, international development organizations, national media houses, corporate headquarters, and financial institutions — alongside a fast-growing creative community. ACS leverages that concentration to position Abuja not merely as an administrative capital, but as a genuine creative economy hub, where talent meets institutional, commercial, and international opportunity in one place.",
  "The Showcase is organized around five pillars. Showcase gives creatives across film, music, fashion, art, and digital media a platform to present their work to the public and to industry stakeholders. Market transforms the event into an actual marketplace, with exhibition spaces where visitors can buy products, commission work, and discover new services and talent. Knowledge delivers practical, real-world sessions on building a sustainable creative business, financing a film, understanding intellectual property, and navigating international markets. The Creative Finance Forum brings together banks, investors, development finance institutions, and government funding bodies to address one of the industry's biggest bottlenecks: access to capital. And the Pitching & Deal Room gives selected creative projects a direct, curated route to investors, commissioners, and distributors — turning a two-day event into a platform with a measurable commercial outcome.",
  "Over the two days, the programme moves deliberately from discovery to transaction. Day One is about connection: an opening ceremony, industry conversations across film, music, fashion, and digital media, the Creative Finance Forum, and an evening of curated screenings and performances. Day Two is about action: masterclasses and workshops in the morning, the Pitching & Deal Room at midday, an International Opportunities Hub in the afternoon exposing Abuja's creatives to markets, fellowships, and grants beyond Nigeria, and a closing ACS Live Concert to bring the Showcase to an end on a high note.",
  "ACS is convened by AFRIGOS Film & Media Academy, whose experience spans film, media, creative education, production, and youth development positions it to serve as a credible convener for a platform this size. But the Showcase is deliberately structured as an industry platform rather than an AFRIGOS-only event — government, private sector, development organizations, industry associations, and individual creatives all contribute to shaping it. The ambition extends beyond any single edition: ACS is intended to become Abuja's annual meeting point for creativity, capital, commerce, and opportunity — a platform through which the capital's creative community discovers what's possible, and finds the people capable of making it happen.",
];

export const programme = [
  {
    day: "Day One",
    title: "Discover & Connect",
    sessions: [
      { time: "Morning", label: "Opening Ceremony", detail: "Welcome, keynote, state of Abuja's creative economy, official opening of the Creative Market." },
      { time: "Midday", label: "Creative Industry Conversations", detail: "Parallel sessions across film & TV, music, fashion, art & photography, publishing, digital media, and creative technology." },
      { time: "Afternoon", label: "Creative Finance Forum", detail: "Funding opportunities, investor conversations, government programmes and grants." },
      { time: "Evening", label: "Film & Creative Showcase", detail: "Curated screenings, artist conversations, performances." },
    ],
  },
  {
    day: "Day Two",
    title: "Create, Pitch & Transact",
    sessions: [
      { time: "Morning", label: "Masterclasses & Workshops", detail: "Practical sessions for emerging and established creatives." },
      { time: "Midday", label: "Pitching & Deal Room", detail: "Selected projects pitch to investors, commissioners, brands, distributors and funders." },
      { time: "Afternoon", label: "International Opportunities Hub", detail: "International programmes, markets, fellowships, grants and collaborations." },
      { time: "Afternoon/Evening", label: "Fashion, Art & Creative Showcase", detail: "Fashion presentations, visual art and photography exhibitions running alongside the day's programme." },
      { time: "Evening", label: "ACS Live Concert & Closing Celebration", detail: "A major live entertainment experience closing out the Showcase." },
    ],
  },
];

export const faqs = [
  {
    q: "Who is Abuja Creative Showcase for?",
    a: "Creatives across film, music, fashion, art, publishing, gaming, and digital media; industry stakeholders like production companies, labels and distributors; investors and funding institutions; and the general public.",
  },
  {
    q: "How do I take part?",
    a: "Registration opens soon. General audience tickets will be open registration. Exhibitor, speaker, press and pitching spots go through an application and review process.",
  },
  {
    q: "Is there a fee to attend?",
    a: "General and VIP ticket pricing will be announced closer to the event. Masterclasses are sold as a separate pass.",
  },
  {
    q: "Can my organization exhibit or sponsor?",
    a: "Yes. Exhibitor applications and sponsorship packages will open ahead of the event — check back here or use the contact details in the footer.",
  },
];

export const sponsorshipTiers = [
  { name: "Bronze Sponsor", price: "₦1,500,000", amount: 1500000 },
  { name: "Silver Sponsor", price: "₦2,500,000", amount: 2500000 },
  { name: "Gold Partner", price: "₦5,000,000", amount: 5000000 },
  { name: "Platinum Partner", price: "₦10,000,000", amount: 10000000 },
  { name: "Presenting Partner", price: "₦15,000,000", amount: 15000000 },
  { name: "Title Partner", price: "₦25,000,000", amount: 25000000 },
];

export const participationCategories = [
  {
    name: "Visitor",
    blurb: "Come experience the Showcase — screenings, performances, the creative market, and more.",
    note: "General and VIP tickets available.",
    guaranteed: true,
  },
  {
    name: "Exhibitor",
    blurb: "Showcase your creative business, sell products, and connect with buyers and brands at the Creative Market.",
    note: "Application required — spots not guaranteed.",
    guaranteed: false,
  },
  {
    name: "Speaker",
    blurb: "Share your expertise on an industry panel, masterclass, or conversation.",
    note: "Application required — spots not guaranteed.",
    guaranteed: false,
  },
  {
    name: "Press",
    blurb: "Cover the Showcase — interviews, behind-the-scenes access, and press briefings.",
    note: "Accreditation required — not guaranteed.",
    guaranteed: false,
  },
  {
    name: "Pitching Participant",
    blurb: "Pitch your project directly to investors, commissioners, brands, and distributors in the Deal Room.",
    note: "Application required — spots not guaranteed.",
    guaranteed: false,
  },
];