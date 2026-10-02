import type { Metadata } from "next";
import LegalLayout from "../components/LegalLayout";
import { legal, registrationNote, type LegalSection } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms and Conditions | ${legal.eventName}`,
  description: `The terms that apply to registration, tickets, payments, refunds, hotel accommodation requests and attendance at ${legal.eventName}.`,
};

const keyPoints = [
  "All payments are final and non-refundable, except in the limited cases set out in these terms: a declined application, a duplicate or incorrect charge, an event we cancel without rescheduling, or a rescheduled date you cannot attend. The law may give you further rights.",
  "Tickets are single-use and belong to the person named on them. Keep your ticket number and QR code private, because the first valid scan gets in.",
  "To move to a higher ticket, you pay the difference. We issue a new ticket and the old one stops working.",
  "Masterclasses need their own ticket.",
  "Exhibitor, speaker, press and pitcher applications are reviewed. Applying is not the same as being approved.",
  "A hotel request is a request, not a booking. Your stay is arranged between you and the hotel.",
  "We can refuse entry or remove anyone who breaks the rules or puts others at risk, without a refund.",
  "The event is photographed, filmed and may be livestreamed.",
  "Nothing in these terms takes away legal rights that you cannot give up under Nigerian law.",
];

const sections: LegalSection[] = [
  {
    id: "about-these-terms",
    title: "About these terms",
    blocks: [
      {
        type: "p",
        text: `These Terms and Conditions (“Terms”) are an agreement between you and ${legal.organizer}${registrationNote}, with its office at ${legal.address} (“we”, “us” and “our”). They apply to your use of ${legal.website} (the “Website”) and to everything you register for, buy or attend in connection with ${legal.eventName}, which takes place on ${legal.eventDates} at ${legal.venue} (the “Event”).`,
      },
      {
        type: "p",
        text: `${legal.siteName} is an event run by ${legal.organizer}. It is not a separate legal entity, so any agreement you make through the Website or for the Event is with ${legal.organizer}.`,
      },
      {
        type: "p",
        text: "By using the Website, registering, paying, or attending the Event, you accept these Terms and our Privacy Policy. If you do not accept them, please do not use the Website or register.",
      },
      {
        type: "p",
        text: "You must be at least 18 years old to register or pay. If you are younger, a parent or guardian must register and pay for you, and must accompany and supervise you at the Event. By doing so, the parent or guardian confirms that they are your parent or guardian, and consents on your behalf to us handling your personal information and using your image as described in these Terms and our Privacy Policy. If you register for a company or organisation, you confirm that you have the authority to bind it to these Terms.",
      },
    ],
  },
  {
    id: "definitions",
    title: "Words we use",
    blocks: [
      {
        type: "ul",
        items: [
          "“Application” means a request to take part in the Event in a category that we review, such as exhibitor, speaker, press or pitcher.",
          "“Category” means the way you register, for example visitor, exhibitor, speaker, press or pitcher.",
          "“Ticket” means the digital pass, ticket number and QR code we issue to you for the Event.",
          "“Masterclass” means a separate, ticketed workshop or session at the Event.",
          "“Partner Hotel” means a hotel that we pass accommodation requests to.",
          "“Content” means any text, images, logos, video, documents or other material that you submit to us.",
          "“Force Majeure Event” means anything outside our reasonable control, as described in the section on changes, cancellation and force majeure.",
        ],
      },
    ],
  },
  {
    id: "using-the-website",
    title: "Using the Website",
    blocks: [
      {
        type: "p",
        text: "You may use the Website only for lawful purposes and in line with these Terms. You must give accurate, complete and current information, and keep it up to date. You are responsible for anything done with your ticket number, QR code, verification codes or registration details, so keep them private.",
      },
      {
        type: "p",
        text: "You must not:",
      },
      {
        type: "ul",
        items: [
          "give false or misleading information, or register using someone else's identity without permission",
          "use bots, scripts or other automated tools to register, buy tickets, or collect information from the Website",
          "try to gain unauthorised access to the Website, our systems, other people's records or our admin tools",
          "introduce viruses or other harmful code, or disrupt or overload the Website",
          "copy, resell or tout tickets, or create or use fake tickets",
          "use the Website to harass, defraud or harm anyone, or to send spam",
          "use the Website in any way that breaks Nigerian law, including the Cybercrimes (Prohibition, Prevention, etc.) Act",
        ],
      },
    ],
  },
  {
    id: "registration",
    title: "Registration",
    blocks: [
      {
        type: "p",
        text: "You register by completing the form for your Category and confirming your email address with the one-time verification code we send you. Registering does not guarantee a place. A ticket is valid only once we have confirmed your payment, where payment is required, and, for Categories that need approval, once we have approved your Application.",
      },
      {
        type: "p",
        text: "You are responsible for entering the correct email address and phone number. We are not liable if you do not receive our messages because of a mistake in your details, a full inbox, or a spam filter.",
      },
      {
        type: "p",
        text: "Duplicate registrations may be merged or cancelled. If we cancel a duplicate, we will keep the registration that has been paid for.",
      },
    ],
  },
  {
    id: "applications",
    title: "Applications that need approval",
    blocks: [
      {
        type: "p",
        text: "Exhibitor, speaker, press, pitcher and some other Categories are reviewed by our team. We decide at our sole discretion, taking into account fit with the programme, space, quality, safety and any other factor we consider relevant. We may ask for more information, and we are not required to give detailed reasons for our decision. Our decision is final.",
      },
      {
        type: "p",
        text: "Submitting an Application is not an offer that we must accept, and approval does not create any right to a particular space, session time, accreditation or outcome beyond what we confirm to you in writing. We may approve an Application on conditions, and we may withdraw approval if the information in your Application turns out to be false or you break these Terms.",
      },
    ],
  },
  {
    id: "tickets",
    title: "Tickets",
    blocks: [
      {
        type: "p",
        text: "A Ticket is a limited, revocable licence to attend the Event on the dates and at the access level it shows. It is not property that you own. Each Ticket admits one person.",
      },
      {
        type: "ul",
        items: [
          "A Ticket is personal to the person it is issued to. It cannot be transferred or resold. We may approve a change of name in writing if you ask before the Event, and we may refuse.",
          "Each QR code works once. When it is scanned at the entrance, we mark the Ticket as used. If someone else has already used your Ticket number or QR code, we cannot admit you or issue a replacement, so do not share or post them.",
          "You may need to show photo identification that matches the name on the Ticket.",
          "If you lose your Ticket, contact us before the Event, and we will help where we can verify that you are the owner. We are not responsible for a Ticket that is lost, stolen, copied or shared.",
          "Tickets that we believe are fake, resold, obtained by fraud, or paid for with a payment that was reversed are void, and we may refuse entry.",
          "A Ticket gives access to the areas and sessions described for that Ticket type. It does not include accommodation, transport or meals unless we say so.",
        ],
      },
    ],
  },
  {
    id: "upgrades",
    title: "Ticket upgrades",
    blocks: [
      {
        type: "p",
        text: "If you hold a lower-level Ticket, you may upgrade to a higher one, subject to availability. To upgrade, you pay the difference in price. We then issue a new Ticket with a new number and QR code, and the old Ticket becomes invalid and can no longer be used.",
      },
      {
        type: "ul",
        items: [
          "Upgrade payments are final, like all other payments.",
          "We do not offer downgrades, and we do not refund the difference if you want a lower Ticket.",
          "Once an upgrade is complete, you must use the new Ticket. Do not share the old one.",
        ],
      },
    ],
  },
  {
    id: "masterclasses",
    title: "Masterclasses",
    blocks: [
      {
        type: "p",
        text: "Masterclasses are sold separately from Event tickets. Seats are limited and are held only after payment is confirmed. Masterclass tickets are subject to the same payment and refund rules as every other ticket.",
      },
      {
        type: "ul",
        items: [
          "We may change the instructor, time, venue or format of a Masterclass where necessary.",
          "Entry may close once a Masterclass has started.",
          "Recording is not allowed unless we say so. Materials shared in a Masterclass are protected by copyright and are for your personal use only.",
          "A Masterclass seat cannot be passed to someone else unless we approve a name change in writing.",
        ],
      },
    ],
  },
  {
    id: "prices-and-payment",
    title: "Prices and payment",
    blocks: [
      {
        type: "ul",
        items: [
          "Prices are shown on the Website in the currency stated at checkout, with any taxes or charges shown there. The price you see when you pay is the price that applies. We may change prices at any time before you pay.",
          "We do not hold a Ticket or seat for you until payment is confirmed.",
          "Payments are processed by third-party payment providers, whose terms apply. They may charge fees or apply exchange rates, and you are responsible for those.",
          "You must be authorised to use the payment method you choose.",
          "A Ticket is valid only after we confirm your payment, usually by email or a payment reference. If a payment fails, is reversed or is found to be fraudulent, the Ticket is void.",
          "If a technical fault charges you twice for the same item, or charges an amount we did not advertise, tell us as soon as possible. We will check our records and refund the duplicate or incorrect amount once we have verified it.",
        ],
      },
    ],
  },
  {
    id: "no-refunds",
    title: "All payments are final",
    blocks: [
      {
        type: "callout",
        text: "Payments are final and non-refundable once made. The only exceptions are the ones in these Terms: where we decline your Application, where you were charged twice or incorrectly because of a fault, where we cancel the Event and do not reschedule it, and where you cannot attend a rescheduled date and tell us in time. Nothing here limits a refund that the law requires.",
      },
      {
        type: "p",
        text: "This applies to Tickets, upgrades, Masterclass seats, exhibitor or other fees and any other payment to us. In particular, we do not give refunds, credits or exchanges for:",
      },
      {
        type: "ul",
        items: [
          "a change of mind or a change of plans",
          "being unable to attend because of illness, travel, visa, work, family or any other personal reason",
          "late arrival, leaving early, or missing sessions",
          "dissatisfaction with the programme, speakers, exhibitors, venue, facilities or the Event in general",
          "changes to the schedule, line-up, sessions, venue or format, as long as the Event goes ahead",
          "buying the wrong Ticket type, which you can fix by upgrading, as described above",
          "a Ticket that is lost, stolen, copied or shared",
          "being refused entry or removed for breaking these Terms or the Event rules",
          "travel, hotel, visa or other costs that you paid to anyone else",
        ],
      },
      {
        type: "p",
        text: "Please be sure of your choice before you pay.",
      },
    ],
  },
  {
    id: "declined-applications",
    title: "Refunds when we decline your application",
    blocks: [
      {
        type: "p",
        text: "If you paid for a Category that needs approval and we decline your Application, we will refund the amount you paid for that Application to the payment method you used. We normally do this within 14 working days of our decision, though your bank or payment provider may take longer.",
      },
      {
        type: "ul",
        items: [
          "A refund in this case is your only remedy. It does not cover costs you paid to anyone else.",
          "If we approve your Application and you later withdraw or do not take part, no refund is due.",
          "If we withdraw approval because of false information or a breach of these Terms, no refund is due.",
        ],
      },
    ],
  },
  {
    id: "chargebacks",
    title: "Chargebacks and payment disputes",
    blocks: [
      {
        type: "p",
        text: "If you have a problem with a payment, please contact us first so that we can look into it. If you ask your bank or card provider to reverse a payment that these Terms say is final, we may dispute the reversal with evidence such as our registration, payment and scan records and our messages with you. We may also cancel the related Tickets, refuse entry, and, as far as the law allows, recover the amount and any costs and fees we incur.",
      },
    ],
  },
  {
    id: "changes-and-force-majeure",
    title: "Changes, cancellation and force majeure",
    blocks: [
      {
        type: "p",
        text: "The programme, line-up, sessions, times, venue layout, exhibitors and speakers may change. We may also change the format, shorten, move or merge sessions, or move the Event to a different venue or date. We will tell you of significant changes using the contact details you gave us.",
      },
      {
        type: "ul",
        items: [
          "If we postpone or reschedule the Event, your Ticket stays valid for the new date. If you cannot attend the new date, you may ask us for a refund by emailing us within 14 days of our announcement of the new date, and we will refund you within 14 working days of your request. After that window, no refund is due.",
          "If we change the Event's format, venue or length but it still goes ahead, no refund is due.",
          "If we cancel the Event and do not reschedule it, we will refund the face value of the Tickets and fees you paid us within 14 working days of announcing the cancellation. We do not refund booking or payment charges made by others, or costs such as travel, accommodation and visas.",
        ],
      },
      {
        type: "p",
        text: "We are not liable for any delay, change or cancellation caused by a Force Majeure Event. That means anything outside our reasonable control, including natural disasters, extreme weather, fire, flood, epidemics or health restrictions, war, terrorism, civil unrest, strikes, security threats, government action or orders, venue closure or unavailability, power or internet failure, and the failure of suppliers or utilities. In those cases we may reschedule, change the format or cancel. If a Force Majeure Event leads us to cancel the Event and not reschedule it, the cancellation refund above applies. If it leads us to postpone or reschedule, the rescheduling rule above applies. We are not liable for any other loss that it causes.",
      },
    ],
  },
  {
    id: "hotel-requests",
    title: "Hotel accommodation requests",
    blocks: [
      {
        type: "p",
        text: "The accommodation form is a request service. It is not a booking, and we are not a hotel or a travel agent.",
      },
      {
        type: "ul",
        items: [
          "When you submit a request, and with your consent given on the form, we pass your details to one or more Partner Hotels, who check availability and may send you options. We do not guarantee availability, a price, a room type or a reply from any hotel.",
          "Your budget range, preferred area and special requests are preferences. They are not promises, and hotels may quote differently.",
          "If you accept an option, your stay is a separate agreement between you and the hotel, under the hotel's own terms, including its prices, deposits, cancellation and refund rules, check-in rules and house rules. We are not a party to that agreement.",
          "We are not responsible for the quality, safety, availability, pricing, overbooking, cancellation or conduct of any hotel, or for loss, damage or injury at a hotel.",
          "Hotels set their own occupancy rules. A standard room usually fits two adults. A third adult or an extra bed may cost extra and depends on the hotel and the room size. Children's rules and rates vary by hotel, and children must be declared.",
          "You must declare everyone who will stay. A hotel may refuse guests who exceed a room's capacity or who were not declared.",
          "Hotels may ask for identification at check-in and may ask for a deposit or full payment. Guests are responsible for any damage they cause.",
          "Your Event Ticket does not include accommodation.",
          "Check payment details with us before you send money to anyone who says they represent a hotel or the Event. Only pay to account details that we or the hotel have confirmed through official channels.",
        ],
      },
      {
        type: "p",
        text: "Please read the Privacy Policy to see how we share your details with hotels.",
      },
    ],
  },
  {
    id: "event-conduct",
    title: "Entry and conduct at the Event",
    blocks: [
      {
        type: "p",
        text: "To enter and stay, you must follow these rules and the venue's rules, and obey instructions from our staff, security and the emergency services.",
      },
      {
        type: "ul",
        items: [
          "Show a valid Ticket, and photo identification if asked.",
          "Accept bag checks and security searches.",
          "Do not bring weapons, illegal drugs, fireworks, dangerous or offensive items, or anything the venue or the law prohibits.",
          "Do not harass, threaten, discriminate against, abuse or hurt anyone.",
          "Stay out of restricted areas, and respect capacity limits and signs.",
          "Do not sell, advertise, hand out flyers, solicit sponsorship or run promotions at the Event without our written permission.",
          "Do not fly drones or use professional recording equipment without our written permission.",
          "Re-entry is allowed only where we say so.",
          "Supervise any children who come with you.",
          "Take care of your belongings. They are your responsibility, and lost property is handled as we see fit.",
          "Tell us before the Event if you need accessibility support, and we will do what we reasonably can.",
        ],
      },
      {
        type: "p",
        text: "We and the venue may refuse entry to, or remove, anyone who breaks these rules, appears to be a danger to others, or whose Ticket is invalid. If that happens, no refund is due.",
      },
    ],
  },
  {
    id: "photography",
    title: "Photography, filming and livestream",
    blocks: [
      {
        type: "p",
        text: "We photograph and film the Event, and we may livestream sessions. We put up notices at the venue entrances and in session rooms. By attending, and by agreeing to this when you register, you accept that your image, voice and likeness may appear in this material, and that we and our partners may use it, without payment, for coverage, archives, the Website, social media, reports and the promotion of this and future editions of the Event.",
      },
      {
        type: "p",
        text: `If you do not want to be photographed, tell our crew or email ${legal.contactEmail} before the Event. We will try to avoid you, but we cannot promise this in crowd shots. At any time you can ask us to remove or blur an image in which you can be identified on our own channels, and we will do so within a reasonable time. We cannot recall copies already shared by others or material already printed.`,
      },
      {
        type: "p",
        text: "For a person under 18, the parent or guardian who registers them agrees to this on their behalf and can withdraw that agreement by contacting us. We will not use an identifiable close-up image of a child to promote the Event without that consent. You may take photos and video for personal use only. You may not use recordings of other people or of the Event commercially without our written permission.",
      },
    ],
  },
  {
    id: "exhibitors",
    title: "Additional terms for exhibitors",
    blocks: [
      {
        type: "ul",
        items: [
          "We allocate space at our discretion. Approval does not guarantee a particular location, size or position.",
          "Fees are as stated or agreed in writing and are payable under the payment and refund sections of these Terms.",
          "You must keep to the set-up, opening and dismantling times we give you.",
          "Your display, products, services and claims must be lawful, accurate, safe, and must not infringe anyone's rights.",
          "You are responsible for your own permits, licences, taxes and insurance, and for complying with product, food, health and safety rules that apply to you.",
          "Your goods, equipment and materials are at your own risk. We do not provide security or insurance for them unless we agree in writing.",
          "You may not sublet or share your space without our written permission.",
          "We may remove a display that breaks these Terms or creates a risk, without a refund.",
          "We may list your name, logo and description in the programme, on the Website and on signage.",
        ],
      },
    ],
  },
  {
    id: "speakers",
    title: "Additional terms for speakers",
    blocks: [
      {
        type: "ul",
        items: [
          "A speaking slot is not guaranteed until we confirm it in writing. We may change the time, length, format or room, or replace or cancel a session.",
          "Your content must be lawful and your own, or you must have the right to use it. Do not share confidential information that belongs to someone else.",
          "You give us a non-exclusive, royalty-free licence to record, edit, livestream, publish and archive your session, and to use your name, image, biography and slides to promote the Event, for as long as we reasonably need them for our archive and promotion.",
          "Unless we agree otherwise in writing, speaking is unpaid and we do not cover travel, accommodation or other costs.",
          "Speakers' views are their own and are not endorsed by us.",
        ],
      },
    ],
  },
  {
    id: "press",
    title: "Additional terms for press and media",
    blocks: [
      {
        type: "ul",
        items: [
          "Accreditation is at our discretion and may be withdrawn at any time.",
          "You must show valid press identification and follow our media guidelines and any restrictions on areas or sessions.",
          "You may use the Event's name and logo only to report on the Event.",
          "You may not sell or license footage or photographs of the Event, or of other people, without our written permission.",
          "We do not control what you publish and are not responsible for it.",
        ],
      },
    ],
  },
  {
    id: "pitchers",
    title: "Additional terms for pitchers",
    blocks: [
      {
        type: "ul",
        items: [
          "You keep ownership of your ideas, projects and materials. You must have the right to share everything you present.",
          "Pitch sessions may be public or recorded, so do not present trade secrets or anything you need to keep confidential. We do not sign non-disclosure agreements by default and cannot promise that what is said in a public session stays confidential.",
          "We do not guarantee that you will be selected, receive feedback, funding, investment, partnerships or any other outcome.",
          "Any discussion or deal with an investor, partner, judge or other attendee is between you and that person. We are not a party to it and are not responsible for it. Carry out your own checks on anyone you deal with.",
          "Selection and judging decisions are final.",
          "We may record and publish your pitch under the photography and filming section.",
        ],
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    blocks: [
      {
        type: "p",
        text: `The Website and everything on it, including text, design, graphics, logos, video, and the names “${legal.siteName}”, “AFRIQA” and “AFRIGOS”, belong to us or our licensors and are protected by law. We give you a limited, personal, non-commercial licence to view the Website. You may not copy, modify, distribute, scrape, resell or use it, or our names and logos, without our written permission. Third-party material, such as YouTube videos, belongs to its owners.`,
      },
      {
        type: "p",
        text: `If you believe something on the Website infringes your copyright, email ${legal.contactEmail} with what it is, where it appears and proof that you own the rights, and we will look into it.`,
      },
    ],
  },
  {
    id: "your-content",
    title: "Your content",
    blocks: [
      {
        type: "p",
        text: "You are responsible for any Content you submit. You confirm that you own it or have the right to share it, that it is accurate and lawful, and that it does not infringe anyone's rights. You give us a non-exclusive, royalty-free licence to use, copy, edit and display your Content to review your Application, to run the Event, and to promote it. We may remove any Content at any time, and we do not check it for accuracy.",
      },
    ],
  },
  {
    id: "third-parties",
    title: "Other people's services and links",
    blocks: [
      {
        type: "p",
        text: "The Website may link to or embed services run by others, such as YouTube, payment providers, hotels, sponsors and social media platforms. Their own terms and privacy policies apply when you use them. We do not control them, endorse them or accept responsibility for them.",
      },
    ],
  },
  {
    id: "communications",
    title: "Communications",
    blocks: [
      {
        type: "p",
        text: "You agree that we may contact you electronically, by email, SMS, WhatsApp, phone or on the Website, about your registration, payments, Tickets, hotel requests and the Event. These service messages are not marketing, and you cannot opt out of them while you hold a Ticket or have a request open. We send marketing only with your consent, and you can unsubscribe at any time. Please keep your contact details current and check your spam folder.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    blocks: [
      {
        type: "p",
        text: "Our Privacy Policy explains how we collect, use, share and protect your personal information. By using the Website and registering, you confirm that you have read it.",
      },
    ],
  },
  {
    id: "fraud-and-suspension",
    title: "Fraud, suspension and cancellation by us",
    blocks: [
      {
        type: "p",
        text: "We may refuse a registration, cancel a Ticket, deny entry, or block access to the Website if we reasonably believe that you gave false information, committed or attempted fraud, resold or copied a Ticket, caused a payment to be reversed, broke these Terms, or pose a risk to the safety or enjoyment of others. We may ask for proof of identity or payment first. We may report suspected crimes to the authorities. If we act because of something you did, no refund is due.",
      },
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    blocks: [
      {
        type: "p",
        text: "The Website and its information are provided “as is” and “as available”. We try to keep them accurate and running, but we do not promise that they will be error-free, uninterrupted or always current. Prices, programme details, speakers, exhibitors, times and images are subject to change.",
      },
      {
        type: "p",
        text: "We do not promise any business result from attending, including networking, sales, investment, partnerships, press coverage or exposure. Any result depends on you and the people you deal with.",
      },
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limits on our liability",
    blocks: [
      {
        type: "p",
        text: "Nothing in these Terms limits or excludes liability for death or personal injury caused by negligence, for fraud, or for anything else that the law does not allow us to limit or exclude.",
      },
      {
        type: "p",
        text: "Subject to that, and as far as the law allows:",
      },
      {
        type: "ul",
        items: [
          "we are not liable for indirect or consequential loss, or for loss of profit, business, opportunity, goodwill or data, or for travel, accommodation, visa or other costs that you incur in relying on the Event going ahead as planned",
          "our total liability to you for any claim connected with the Website or the Event is limited to the amount you paid us for the Ticket, seat or fee that the claim relates to",
          "you attend the Event and bring your belongings at your own risk",
          "we are not liable for what hotels, venue staff, suppliers, sponsors, other attendees or other third parties do or fail to do",
          "we are not liable for any delay or failure caused by a Force Majeure Event",
        ],
      },
    ],
  },
  {
    id: "your-legal-rights",
    title: "Your legal rights",
    blocks: [
      {
        type: "p",
        text: "These Terms do not take away any right that you have under Nigerian law and cannot give up, including your rights under the Federal Competition and Consumer Protection Act 2018. If any part of these Terms is found unenforceable against you, the rest still applies.",
      },
    ],
  },
  {
    id: "indemnity",
    title: "Your responsibility for claims",
    blocks: [
      {
        type: "p",
        text: "As far as the law allows, exhibitors, speakers, press members and pitchers agree to cover us, our officers, staff, volunteers and partners against claims, losses and costs, including reasonable legal fees, that arise from their Content, their display, products or equipment, their conduct at the Event, or their breach of these Terms. Any other attendee is responsible for loss or damage that they cause to our property, the venue or other people by breaking these Terms or the Event rules.",
      },
    ],
  },
  {
    id: "disputes",
    title: "Governing law and disputes",
    blocks: [
      {
        type: "p",
        text: `These Terms are governed by the laws of the Federal Republic of Nigeria. If you have a complaint, write to ${legal.contactEmail} first. We will try to resolve it within 30 days.`,
      },
      {
        type: "p",
        text: "If we cannot resolve it, the dispute will be referred to arbitration under the Arbitration and Mediation Act 2023, with one arbitrator, in English, seated in Abuja. Unless the arbitrator decides otherwise, the arbitrator's fees are shared equally and each of us pays our own legal costs. Either of us may ask a court for urgent relief. The courts of the Federal Capital Territory, Abuja have jurisdiction over any matter that is not referred to arbitration, and over enforcing an award.",
      },
      {
        type: "p",
        text: "If you are an individual who bought a Ticket for personal use, you may choose to bring your claim in the courts of the Federal Capital Territory, Abuja, including a small claims route where one is available, instead of arbitration. This does not stop you from complaining to the Federal Competition and Consumer Protection Commission, or from using a court where the law gives you that right.",
      },
    ],
  },
  {
    id: "changes-to-terms",
    title: "Changes to these Terms",
    blocks: [
      {
        type: "p",
        text: "We may update these Terms. The new version applies from the date we post it. For a Ticket or seat you have already paid for, the Terms in force when you paid continue to apply, unless we must change them for legal, safety or security reasons. By continuing to use the Website after a change, you accept the updated Terms.",
      },
    ],
  },
  {
    id: "general",
    title: "General",
    blocks: [
      {
        type: "ul",
        items: [
          "These Terms, with the Privacy Policy and any written confirmation we send you, are the whole agreement between us on this subject.",
          "If a part of these Terms is invalid or unenforceable, the rest stays in force.",
          "If we do not enforce a right straight away, we have not given it up.",
          "You may not transfer your rights or duties under these Terms without our written consent. We may transfer ours.",
          "Nothing here makes you our partner, agent or employee.",
          "Only you and we have rights under these Terms. No one else can enforce them.",
          "Our records of registrations, payments, messages and ticket scans are accepted as evidence unless shown to be wrong.",
          "Clauses that by their nature should continue after the Event, such as payment, liability, intellectual property and disputes, do continue.",
          "These Terms are written in English, and the English version prevails.",
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    blocks: [
      {
        type: "ul",
        items: [
          `Organiser: ${legal.organizer}${registrationNote}`,
          `Address: ${legal.address}`,
          `Email: ${legal.contactEmail}`,
          `Phone or WhatsApp: ${legal.phone}`,
        ],
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms and Conditions"
      intro={`These terms explain the rules for registering, buying tickets, paying, requesting hotels and attending ${legal.eventName}. Please read them before you register or pay.`}
      keyPointsTitle="The key points"
      keyPoints={keyPoints}
      sections={sections}
      other={{
        href: "/privacy-policy",
        label: "Read the Privacy Policy",
        text: "How we collect, use, share and protect your personal information is covered in our Privacy Policy.",
      }}
    />
  );
}
