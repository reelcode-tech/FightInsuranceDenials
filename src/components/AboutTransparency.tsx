import React from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, LockKeyhole, SearchCheck, ShieldCheck } from 'lucide-react';

const pillars = [
  {
    title: 'How we collect',
    text: 'Public reporting, official policy and regulator material, curated research, and patient-submitted stories with explicit consent choices.',
    icon: SearchCheck,
  },
  {
    title: 'How we protect',
    text: 'We separate private action flows from the public record and strip direct identifiers before stories become public-facing evidence.',
    icon: LockKeyhole,
  },
  {
    title: 'Why this exists',
    text: 'Denials are designed to isolate you. We are building the public record so patients can fight back with data instead of just frustration.',
    icon: HeartHandshake,
  },
];

const trustCommitments = [
  'Public stories are anonymized before they appear in the searchable record.',
  'Users should be able to choose public story, aggregated-only contribution, or private help only.',
  'We do not want a business model based on selling raw health identities.',
  'The value is in the patterns: precedent, benchmarks, oversight, and sharper appeals.',
];

export default function AboutTransparency() {
  return (
    <div className="min-h-screen bg-[#070b16] px-5 py-10 text-[#f5f7ff] md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-[2.8rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_36%),linear-gradient(180deg,#091024_0%,#070b16_100%)] px-8 py-12 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:px-12 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c8b8ff]">About / trust</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-white md:text-6xl">
            A public-interest database for people who got cornered by the system.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#c0c8e6]">
            Health insurance denials are easy to hide when every patient is forced to fight alone. This project exists to make
            those patterns visible, usable, and harder for insurers to explain away.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-[2rem] border border-white/8 bg-[#0d1224] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.25)]"
            >
              <pillar.icon className="h-8 w-8 text-[#8ea9ff]" />
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">{pillar.title}</h2>
              <p className="mt-4 leading-7 text-[#c0c8e6]">{pillar.text}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.3rem] border border-white/8 bg-[#0d1224] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bfb8ef]">Methodology</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
              We weight evidence instead of pretending every source is equal.
            </h3>
            <p className="mt-4 leading-8 text-[#c0c8e6]">
              Official reports, investigative journalism, patient communities, complaint forums, and direct submissions each tell
              a different part of the story. We keep provenance because volume alone is not trust. The goal is usable signal that
              patients, advocates, and journalists can actually act on.
            </p>
          </div>

          <div className="rounded-[2.3rem] border border-white/8 bg-[#0d1224] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#8ea9ff]" />
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Privacy posture</h3>
            </div>
            <ul className="mt-6 space-y-4 text-[#d8def7]">
              {trustCommitments.map((item) => (
                <li key={item} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 leading-7">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
