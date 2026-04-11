import React from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, LockKeyhole, SearchCheck, ShieldCheck } from 'lucide-react';

const pillars = [
  {
    title: 'How we collect',
    text: 'Public sources, curated research, and user-submitted denial stories with clear consent controls.',
    icon: SearchCheck,
  },
  {
    title: 'How we protect',
    text: 'We aim to strip direct identifiers before public display and separate private action flows from public observatory views.',
    icon: LockKeyhole,
  },
  {
    title: 'Why this exists',
    text: 'Because denials are isolating by design, and patients deserve a public record strong enough to fight back with.',
    icon: HeartHandshake,
  },
];

export default function AboutTransparency() {
  return (
    <div className="min-h-screen bg-[#f4efe8] px-5 py-12 md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-[2.5rem] border border-black/8 bg-white/75 px-8 py-10 md:px-12 md:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#8a5a49]">About / transparency / privacy</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight text-[#1f1b17] md:text-6xl">
            A public-interest database for people who got cornered by the system.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#574a40]">
            This project is trying to do two things at once: help individual patients respond to denials, and build a cleaner
            public record of how those denials actually happen across insurers, conditions, and regions.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-[2rem] border border-black/8 bg-[#1d1714] p-7 text-white"
            >
              <pillar.icon className="h-8 w-8 text-[#e9b08e]" />
              <h2 className="mt-5 text-2xl font-bold tracking-tight">{pillar.title}</h2>
              <p className="mt-4 leading-relaxed text-white/72">{pillar.text}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/8 bg-[#eadfce] p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a5a49]">Method</p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#1f1b17]">We weight evidence instead of pretending every source is equal.</h3>
            <p className="mt-4 leading-relaxed text-[#574a40]">
              Official reports, investigative work, public patient forums, and complaint platforms each tell a different part of the story.
              We keep provenance because the point is not just volume. It is usable, explainable signal.
            </p>
          </div>

          <div className="rounded-[2rem] border border-black/8 bg-white/75 p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#b43c2e]" />
              <h3 className="text-2xl font-bold tracking-tight text-[#1f1b17]">Privacy posture</h3>
            </div>
            <ul className="mt-6 space-y-4 text-[#574a40]">
              <li>Public stories should be anonymized before they are shown.</li>
              <li>Users need clear choices: public story, aggregated-only, or fully private.</li>
              <li>We do not want a business model based on selling raw personal health identities.</li>
              <li>B2B value should come from patterns, benchmarks, and reporting.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
