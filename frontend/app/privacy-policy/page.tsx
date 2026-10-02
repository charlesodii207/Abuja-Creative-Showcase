import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";
import { legal, registrationNote, type LegalSection } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy | ${legal.eventName}`,
  description: `How ${legal.organizer} collects, uses, shares and protects personal information for ${legal.eventName}, including registration, ticketing, payments and hotel accommodation requests.`,
};

const keyPoints = [
  "We collect only what we need to register you, issue your ticket, take payment, review applications and handle hotel requests.",
  "We do not sell your personal information.",
  "When you send a hotel request, we pass your details to partner hotels so they can offer you options.",
  "You enter card and bank details on our payment provider's secure page. We do not store full card numbers.",
  "The event is photographed, filmed and may be livestreamed, so you may appear in coverage.",
  "You can ask to see, correct, delete or restrict your information, or object to how we use it, by emailing us.",
  "Payments are final once made, unless we decline your application. The Terms and Conditions explain this in full.",
];

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    blocks: [
      {
        type: "p",
        text: `${legal.organizer}${registrationNote} (“we”, “us” and “our”) organises ${legal.eventName}, taking place on ${legal.eventDates} at ${legal.venue}. We operate this website at ${legal.website}.`,
      },
      {
        type: "p",
        text: `Our office is at ${legal.address}. For the personal information described in this policy, we are the data controller, which means we decide how and why your information is used.`,
      },
      {
        type: "p",
        text: `Questions about this policy or your information can go to ${legal.privacyEmail}.`,
      },
    ],
  },
  {
    id: "scope",
    title: "What this policy covers",
    blocks: [
      {
        type: "p",
        text: "This policy applies to everything you do on or through the website and around the event, including:",
      },
      {
        type: "ul",
        items: [
          "registering as a visitor, exhibitor, speaker, press member, pitcher or any other category we offer",
          "buying tickets, masterclass seats and ticket upgrades",
          "making payments",
          "confirming your email address with a verification code",
          "sending a hotel accommodation request",
          "contacting us through forms, email, WhatsApp or social media",
          "checking in at the venue and attending the event",
        ],
      },
      {
        type: "p",
        text: "It does not cover other websites that we link to, or the separate policies of hotels, payment providers, sponsors and social media platforms.",
      },
      {
        type: "callout",
        text: "By using the website, registering, paying or submitting a request, you confirm that you have read this policy. Where the law requires your consent for something, we will ask for it separately.",
      },
    ],
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    blocks: [
      {
        type: "p",
        text: "Depending on how you use the website and which category you register under, we collect:",
      },
      {
        type: "ul",
        items: [
          "Identity and contact details: your full name, email address, phone or WhatsApp number, and your country or city.",
          "Registration details: the category you register under, your ticket type, and what you tell us in an application, such as your organisation or brand, role, website or portfolio links, biography, photos, or a description of your business or project.",
          "Ticket details: your ticket number or reference, ticket type, QR code, upgrade history, and whether and when your ticket was scanned at the venue.",
          "Verification details: the one-time code we email you to confirm your address, and whether it was used.",
          "Payment details: the amount, date, status and transaction reference of each payment, and the type of payment method used. We do not see or store full card numbers.",
          "Hotel request details: your arrival date, number of nights, number of adults and children, rooms needed, any extra bed request, budget range, preferred area, special requests, and a record that you accepted this policy.",
          "Messages: what you send us through forms, email, WhatsApp or social media, and our replies.",
          "Technical details: your IP address, device and browser type, operating system, pages viewed, referring page, date and time of visits, and error logs.",
          "Event-day information: ticket scan records, photographs, video and livestream recordings, and security or CCTV footage at the venue.",
          "Team details: for people who help run the event, login details, role and activity logs in our admin tools.",
        ],
      },
      {
        type: "p",
        text: "We do not ask for sensitive information such as your health, religion, political views or ethnicity. The special requests box on a hotel request is free text, so please share only what you are comfortable with. If you mention something like an accessibility, dietary or medical need, we treat it as sensitive, use it only to arrange what you asked for, and share it only with the hotel or venue where needed to meet your request.",
      },
    ],
  },
  {
    id: "how-we-collect",
    title: "How we collect it",
    blocks: [
      {
        type: "ul",
        items: [
          "Directly from you, when you fill in a form, pay, email us or speak to our team.",
          "Automatically, through your browser or device when you visit the website, and through ticket scanning at the venue.",
          "From others, such as payment providers confirming a payment, hotels confirming availability, or a colleague, employer or friend who registers or pays on your behalf.",
        ],
      },
      {
        type: "p",
        text: "If you give us another person's details, for example when you book for a group, you confirm that you have their permission and that you have told them how we will use their information.",
      },
    ],
  },
  {
    id: "why-we-use-it",
    title: "How we use your information and why",
    blocks: [
      {
        type: "p",
        text: "Data protection law requires us to have a legal basis for each use. These are ours:",
      },
      {
        type: "ul",
        items: [
          "To register you, issue your ticket and manage your application. Basis: performing our agreement with you.",
          "To verify your email and prevent fake or duplicate registrations. Basis: performing our agreement, and our legitimate interest in keeping the event and website secure.",
          "To take payments, confirm them and keep financial records. Basis: performing our agreement, and our legal obligations.",
          "To review applications from exhibitors, speakers, press and pitchers. Basis: steps taken at your request before an agreement, and our legitimate interest in building a suitable programme.",
          "To check you in and manage safety and capacity at the venue. Basis: performing our agreement, and our legitimate interest in safety and security.",
          "To pass your hotel request to partner hotels and follow up with options. Basis: steps taken at your request, and your consent to share your details with hotels.",
          "To send confirmations, schedule changes and other service messages. Basis: performing our agreement, and our legitimate interests.",
          "To send marketing about future events, sponsors or offers. Basis: your consent.",
          "To answer questions and handle complaints. Basis: our legitimate interests and, where relevant, our agreement with you.",
          "To photograph, film and livestream the event and to promote it afterwards. Basis: our legitimate interest in promoting the event, and your consent where the law requires it.",
          "To improve the website, understand how it is used and fix errors. Basis: our legitimate interests, and your consent for non-essential cookies where required.",
          "To detect and prevent fraud, abuse and security incidents, and to enforce our Terms and Conditions. Basis: our legitimate interests and legal obligations.",
          "To comply with the law, respond to lawful requests from authorities, and establish or defend legal claims. Basis: legal obligation and our legitimate interests.",
        ],
      },
      {
        type: "p",
        text: "Where we rely on legitimate interests, we weigh them against your rights and interests first. Where we rely on consent, you can withdraw it at any time by contacting us. Withdrawing does not affect anything we did before you withdrew.",
      },
    ],
  },
  {
    id: "registration-and-tickets",
    title: "Registration, tickets and check-in",
    blocks: [
      {
        type: "p",
        text: "Your registration record is linked to your ticket number. Anyone who holds your ticket number or QR code can present it at the entrance, so keep both private.",
      },
      {
        type: "p",
        text: "We email you a verification code to confirm that you own the address you gave us. Entering the code is how you prove it, so do not share the code with anyone.",
      },
      {
        type: "p",
        text: "If your category needs approval, our team reviews what you submitted and people make the decision. When you upgrade a ticket, we create a new ticket record and mark the old one invalid. We keep both records for audit and financial reasons.",
      },
      {
        type: "p",
        text: "When your QR code is scanned at the venue, we record the time and mark the ticket as used so it cannot be used twice.",
      },
      {
        type: "p",
        text: "If you are an exhibitor, speaker, press member or pitcher, we may publish your name, organisation, photo and biography on the website, programme, signage and social media. We will tell you where, and we will ask you first where the law requires it.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    blocks: [
      {
        type: "p",
        text: "We use third-party payment providers. When you pay, you enter your card or bank details on their secure page, and their own privacy policy applies to what you enter there. We receive confirmation that the payment succeeded or failed, the amount and a reference. We do not store full card numbers, expiry dates or security codes.",
      },
      {
        type: "p",
        text: "We share your name, email and transaction details with the payment provider and our bank to complete the payment, prevent fraud and reconcile our accounts.",
      },
      {
        type: "p",
        text: "Payments are final once made, except where we decline your application. The Terms and Conditions page sets out the full refund position.",
      },
    ],
  },
  {
    id: "hotel-requests",
    title: "Hotel accommodation requests",
    blocks: [
      {
        type: "p",
        text: "The accommodation form lets you tell us your dates, party size, budget and preferences so that we can match you with a partner hotel. We are not the hotel. Unless we tell you otherwise, your stay is arranged between you and the hotel, under the hotel's own terms and privacy policy.",
      },
      {
        type: "p",
        text: "When you submit a request, we share the details you gave us with one or more partner hotels so they can check availability and send you options. That includes your name, contact details, dates, the number of adults and children, rooms needed, extra bed request, budget, area and special requests.",
      },
      {
        type: "ul",
        items: [
          "We ask only for the number of children. We do not collect their names or ages.",
          "Hotels may require identification at check-in under their own policies or the law, and they collect that themselves.",
          "Once a hotel has your details, it is responsible for how it uses them. Contact the hotel directly about its handling of your information.",
          "We keep request records so that we can follow up with you and handle any disputes.",
        ],
      },
      {
        type: "p",
        text: "The accommodation form asks for your separate consent before we share your details with hotels. If you do not want us to share your details, please do not submit a request.",
      },
    ],
  },
  {
    id: "sharing",
    title: "Who we share it with",
    blocks: [
      {
        type: "p",
        text: "We do not sell your personal information. We share it only in these ways:",
      },
      {
        type: "ul",
        items: [
          "Service providers who help us run the website and event, such as hosting and cloud storage, email and messaging delivery, payment processing, analytics, security, ticket scanning and support tools. They act on our instructions and must protect your information.",
          "Partner hotels, as described above.",
          "The venue, security teams and accredited event suppliers, where they need it to run the event, for example an access list.",
          "Sponsors and partners, only as aggregated or anonymised statistics, unless you have agreed to be contacted or listed, for example in an exhibitor directory.",
          "The public, for information you have agreed to publish, such as a speaker biography.",
          "Authorities and advisers, such as regulators, courts, law enforcement, tax authorities, lawyers, auditors and insurers, when the law requires it or when we need to protect our rights.",
          "A successor, if the event or our organisation is merged, sold or transferred, in which case this policy continues to protect your information.",
          "Anyone else, with your consent.",
        ],
      },
    ],
  },
  {
    id: "photos-and-livestream",
    title: "Photography, filming and livestream",
    blocks: [
      {
        type: "p",
        text: "The event is photographed and filmed, and some sessions may be livestreamed. By attending, you may appear in photos, video and streams. We put up notices at the entrances, and the registration form asks for your agreement.",
      },
      {
        type: "p",
        text: "We use this material for event coverage, archives, the website, social media, reports for sponsors and partners, and promotion of future events. It may stay online or in our archive for a long time.",
      },
      {
        type: "p",
        text: `If you do not want to be photographed, tell a member of our crew or email ${legal.privacyEmail} before the Event, and we will try to avoid you, though we cannot promise this in crowd shots. If you are identifiable in an image we hold and you want it removed or blurred, contact us at any time and we will act on our own channels within a reasonable time. We cannot recall copies already shared by others or printed material already produced.`,
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    blocks: [
      {
        type: "p",
        text: "Cookies and similar tools are small pieces of data stored on your device. We use essential ones to keep the website secure and working, and we may use analytics tools to understand which pages are useful.",
      },
      {
        type: "p",
        text: "The event trailer on our home page is hosted on YouTube. To get the player ready, the page loads YouTube's player code and the video's thumbnail image from Google's servers when you visit, so Google may receive your IP address and basic device information. Google may also set cookies or similar identifiers when you play the video. Google's privacy policy applies to that information.",
      },
      {
        type: "p",
        text: "You can block or delete cookies in your browser settings, though some parts of the website may stop working. Where the law requires your consent for non-essential cookies, we will ask for it. If we add other analytics or advertising tools, we will update this section.",
      },
    ],
  },
  {
    id: "international-transfers",
    title: "Transfers outside Nigeria",
    blocks: [
      {
        type: "p",
        text: "Some of our service providers, and services such as YouTube, may store or process information outside Nigeria, in countries whose data protection laws differ from Nigeria's. When we transfer personal information abroad, we make sure it has appropriate protection, such as contract terms, a recognised adequacy arrangement, or your consent or the need to perform our agreement with you, as the law allows.",
      },
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    blocks: [
      {
        type: "p",
        text: "We keep personal information only as long as we need it for the purposes above, including legal, accounting and reporting needs. Typical periods are:",
      },
      {
        type: "ul",
        items: [
          "Registration, ticket and check-in records: until the event and up to 24 months afterwards, to handle queries and disputes and plan future events.",
          "Payment and financial records: at least six years, or as Nigerian tax and company law requires.",
          "Declined or incomplete applications: up to 12 months.",
          "Hotel requests: up to 12 months after the event, then deleted or anonymised.",
          "Email verification codes: short-lived, and expired or deleted soon after use.",
          "Marketing contact details: until you unsubscribe or ask us to stop. We then keep a minimal record so that we respect your choice.",
          "Photos and video: kept in our archive for as long as they are useful for promotion and history, unless you ask us to remove an image of you.",
          "Website logs and admin activity logs: usually up to 12 months, and longer where needed to investigate a security incident.",
        ],
      },
      {
        type: "p",
        text: "After that, we delete or anonymise the information. We may keep it longer where the law requires or where we need it to establish or defend a legal claim.",
      },
    ],
  },
  {
    id: "security",
    title: "How we protect it",
    blocks: [
      {
        type: "p",
        text: "We protect your information with encryption in transit (HTTPS), access controls with different permission levels for our team, logging of admin activity, limits on who can see what, and secure hosting. No system is completely secure, so please protect your ticket number, QR code and verification codes, and do not share them.",
      },
      {
        type: "p",
        text: "If a data breach is likely to put your rights at risk, we will notify the Nigeria Data Protection Commission and the people affected within the time the law requires.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    blocks: [
      {
        type: "p",
        text: "Under the Nigeria Data Protection Act 2023 you have the right to:",
      },
      {
        type: "ul",
        items: [
          "be told how your information is used, which this policy does",
          "ask for a copy of the information we hold about you",
          "ask us to correct information that is wrong or incomplete",
          "ask us to delete your information where we no longer need it or you have withdrawn consent, subject to the limits below",
          "ask us to restrict how we use your information",
          "object to our use of your information, including for direct marketing",
          "receive your information in a portable format, where this applies",
          "withdraw your consent at any time",
          "not be subject to a decision based solely on automated processing that significantly affects you",
          "complain to the Nigeria Data Protection Commission",
        ],
      },
      {
        type: "p",
        text: `To use any of these rights, email ${legal.privacyEmail} with your name, the email address you registered with and your ticket number if you have one. We may need to confirm your identity first. We aim to respond within one month, and we do not charge unless a request is clearly unfounded or excessive.`,
      },
      {
        type: "p",
        text: "We may refuse or limit a request where the law requires us to keep the information (financial records, for example), where it would affect other people's rights, or where we need it to prevent fraud or to establish or defend a legal claim. We will explain our reason when that happens.",
      },
      {
        type: "callout",
        text: "Deleting your information can cancel a ticket that is still valid. Asking us to delete your information after you have paid does not create a right to a refund.",
      },
    ],
  },
  {
    id: "automated-checks",
    title: "Automated checks",
    blocks: [
      {
        type: "p",
        text: "We do not make decisions that significantly affect you based only on automated processing. Some checks are automatic, such as validating a QR code, stopping a ticket from being used twice, and spotting duplicate registrations or suspicious payments. People make application decisions. If you think an automatic check flagged you wrongly, contact us and a person will review it.",
      },
    ],
  },
  {
    id: "children",
    title: "Children",
    blocks: [
      {
        type: "p",
        text: "Our website and registration are for adults aged 18 and over. People under 18 should register and attend only with the consent and supervision of a parent or guardian. On hotel requests we collect only the number of children. When a parent or guardian registers a person under 18, they consent on that person's behalf to us handling their information and using their image as described in this policy, and they can withdraw that consent by contacting us. We do not use identifiable close-up images of children to promote the Event without a parent or guardian's consent. If we learn that we hold a child's personal information without proper consent, we will delete it. Parents or guardians who are concerned can contact us.",
      },
    ],
  },
  {
    id: "international-visitors",
    title: "Visitors from outside Nigeria",
    blocks: [
      {
        type: "p",
        text: "If you live in the European Economic Area, the United Kingdom or another place whose data protection law gives you additional rights, those rights apply to the extent that law applies to us. Contact us to use them. This policy describes how we handle everyone's information.",
      },
    ],
  },
  {
    id: "third-party-links",
    title: "Other websites and services",
    blocks: [
      {
        type: "p",
        text: "The website may link to or embed services run by others, such as YouTube, social media platforms, payment providers, hotels and sponsors. We do not control them and are not responsible for their privacy practices. Please read their policies.",
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    blocks: [
      {
        type: "p",
        text: "We may update this policy as the event, the website or the law changes. We will post the new version here with a new date. If a change is significant, we will tell you by email or a notice on the website where we reasonably can. If we want to use information you have already given us for a new purpose, we will ask for your consent where the law requires it.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact us and complaints",
    blocks: [
      {
        type: "ul",
        items: [
          `Organiser: ${legal.organizer}${registrationNote}`,
          `Address: ${legal.address}`,
          `Privacy email: ${legal.privacyEmail}`,
          `General email: ${legal.contactEmail}`,
          `Phone or WhatsApp: ${legal.phone}`,
        ],
      },
      {
        type: "p",
        text: "If you are unhappy with how we handle your information, please contact us first so that we can try to put it right. You also have the right to complain to the Nigeria Data Protection Commission (ndpc.gov.ng).",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro={`This policy explains what personal information ${legal.organizer} collects when you use this website and attend ${legal.eventName}, how we use and share it, how long we keep it, and the choices you have.`}
      keyPointsTitle="In short"
      keyPoints={keyPoints}
      sections={sections}
      other={{
        href: "/terms-and-conditions",
        label: "Read the Terms and Conditions",
        text: "Tickets, payments, refunds, hotel requests and conduct at the event are covered in our Terms and Conditions.",
      }}
    />
  );
}
