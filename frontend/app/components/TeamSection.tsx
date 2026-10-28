"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";

type TeamMember = {
  name: string;
  role: string;
  /** Short one or two sentence bio. Optional: remove the line to hide it. */
  bio?: string;
  /** File name inside /public/images/team/, named after the first name */
  photo: string;
};

const PHOTO_DIR = "/images/team";

const TEAM: TeamMember[] = [
  {
    name: "Paulgold Olalekan Joseph",
    role: "Convener",
    bio: "The vision behind Afriqa Creative Showcase, bringing Africa's creatives, investors and industry leaders together in Abuja.",
    photo: "paulgold.webp",
  },
  {
    name: "Ebere Ojadua",
    role: "Director",
    bio: "Directs the planning and delivery of the showcase, keeping every team and programme aligned with the event's vision.",
    photo: "ebere.webp",
  },
  {
    name: "Happiness Edesiri Obrudu",
    role: "Head of Operations",
    bio: "Oversees day-to-day operations, making sure every part of the showcase runs smoothly from planning to event day.",
    photo: "happiness.webp",
  },
  {
    name: "Susan Sechivir Umah",
    role: "Programmes Coordinator",
    bio: "Coordinates the showcase programme, from masterclasses and sessions to the schedule of activities across both days.",
    photo: "susan.webp",
  },
  {
    name: "Favour Efe Orobosa",
    role: "Head of Administration",
    bio: "Leads administration for the showcase, keeping records, documentation and internal processes organised and on track.",
    photo: "favour.webp",
  },
  {
    name: "David Onyekwe Giant",
    role: "Head of Logistics",
    bio: "Heads logistics, coordinating venue setup, the movement of people and materials, and everything needed on the ground.",
    photo: "david.webp",
  },
  {
    name: "Charles Odii Okechukwu",
    role: "Chief Technology Officer",
    bio: "Leads technology for the showcase, building and maintaining the website, registration and ticketing systems.",
    photo: "charles.webp",
  },
  {
    name: "Caroline Okoh",
    role: "Administrative Manager",
    bio: "Manages administrative support for the team, handling coordination, communication and day-to-day paperwork.",
    photo: "caroline.webp",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TeamCard({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="group mx-auto w-full max-w-[18rem]">
      <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -bottom-3 -left-3 h-full w-full rounded-[2rem] rounded-bl-[3.5rem] border border-[#E59200]/25 transition-transform duration-500 group-hover:-translate-x-1 group-hover:translate-y-1"
      />

      <div
        aria-hidden="true"
        className="absolute -right-3 -top-3 z-20 h-9 w-9 rounded-full border border-[#00A5A8]/40 bg-[#11152F]"
      >
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00A5A8]" />
      </div>

      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] rounded-bl-[3.5rem] rounded-tr-[0.75rem] border border-white/10 bg-[#151A3A] shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#151A3A] to-[#1B2150]">
            <span className="font-display text-5xl text-[#E59200]/70">
              {initials(member.name)}
            </span>
          </div>
        ) : (
          <Image
            src={`${PHOTO_DIR}/${member.photo}`}
            alt={`${member.name}, ${member.role} of AFRIQA Creative Showcase`}
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 22vw"
            quality={75}
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            onError={() => setFailed(true)}
          />
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2.5 rounded-[1.5rem] rounded-bl-[3rem] rounded-tr-[0.5rem] border border-white/10"
        />

        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#11152F]/70 to-transparent" />
      </div>
      </div>

      <div className="relative mt-8 text-center">
        <div className="mx-auto h-px w-10 bg-[#E59200]/60" />

        <h3 className="mt-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#F5EFE6]">
          {member.name}
        </h3>

        <p className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-[#C5BFAF]/55">
          {member.role}
        </p>

        {member.bio && (
          <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/70">
            {member.bio}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TeamSection() {
  return (
    <section
      id="team"
      className="relative overflow-hidden border-b border-white/10 bg-[#0D1128]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full border border-[#00A5A8]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-16 h-44 w-44 rounded-full border border-[#E59200]/10"
      />

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="mb-7 flex items-center justify-center gap-4">
              <div className="tricolor-rule">
                <span />
                <span />
                <span />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C5BFAF]/55">
                The Core Team
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="font-display text-4xl leading-[1.1] text-[#F5EFE6] sm:text-5xl">
              Meet the Team
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-[17px]">
              These are the leads coordinating AFRIQA Creative Showcase, but
              they are only part of the story. Many more people are
              contributing behind the scenes to make it happen.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member, index) => (
            <Reveal key={member.name} delay={(index % 4) * 90}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-20 max-w-2xl text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <div className="tricolor-rule">
                <span />
                <span />
                <span />
              </div>
            </div>

            <p className="text-base leading-relaxed text-[#B8B3AA]/75 sm:text-[17px]">
              Behind every name here is a wider circle of people, and everyone
              else who gives their time, skills and energy to this showcase.
              Every contribution counts, and we are grateful for each one.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
