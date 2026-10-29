"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Reveal from "./Reveal";

type TeamMember = {
  /** Key used to look up the translated role and bio in messages/*.json */
  id: string;
  name: string;
  /** File name inside /public/images/team/, named after the first name */
  photo: string;
};

const PHOTO_DIR = "/images/team";

/**
 * Order matters. On desktop the grid reads left to right:
 * Row 1 (2 people, centred), Row 2 (4 people), Row 3 (4 people).
 * Roles and bios are translated: edit them in messages/*.json under
 * Home.team.members.<id>.
 */
const TEAM: TeamMember[] = [
  // Row 1 (2)
  { id: "paulgold", name: "Paulgold Olalekan Joseph", photo: "paulgold.webp" },
  { id: "ebere", name: "Ebere Ojadua", photo: "ebere.webp" },

  // Row 2 (4)
  { id: "desmond", name: "Desmond Utomwen", photo: "desmond.webp" },
  { id: "happiness", name: "Happiness Edesiri Obrudu", photo: "happiness.webp" },
  { id: "favour", name: "Favour Efe Orobosa", photo: "favour.webp" },
  { id: "susan", name: "Susan Sechivir Umah", photo: "susan.webp" },

  // Row 3 (4)
  { id: "charles", name: "Charles Odii Okechukwu", photo: "charles.webp" },
  { id: "caroline", name: "Caroline Okoh", photo: "caroline.webp" },
  { id: "david", name: "David Onyekwe Ebuka", photo: "david.webp" },
  { id: "jhilblanket", name: "Jhilblanket Oluwaobafemi", photo: "jhilblanket.webp" },
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
  const t = useTranslations("Home.team");
  const [failed, setFailed] = useState(false);
  const role = t(`members.${member.id}.role`);
  const bio = t(`members.${member.id}.bio`);

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
              alt={t("photoAlt", { name: member.name, role })}
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
          {role}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/70">{bio}</p>
      </div>
    </div>
  );
}

export default function TeamSection() {
  const t = useTranslations("Home.team");

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
                {t("eyebrow")}
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="font-display text-4xl leading-[1.1] text-[#F5EFE6] sm:text-5xl">
              {t("heading")}
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-[17px]">
              {t("intro")}
            </p>
          </Reveal>
        </div>

        {/* Desktop layout: 2 / 4 / 4. Card 0 starts in column 2 so the top row is centred; card 2 is forced back to column 1 so it starts the second row. */}
        <div className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member, index) => (
            <div
              key={member.name}
              className={
                index === 0
                  ? "lg:col-start-2"
                  : index === 2
                    ? "lg:col-start-1"
                    : ""
              }
            >
              <Reveal delay={(index % 4) * 90}>
                <TeamCard member={member} />
              </Reveal>
            </div>
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
              {t("outro")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
