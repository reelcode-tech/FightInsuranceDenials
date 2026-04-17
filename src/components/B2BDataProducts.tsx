import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { ArrowRight, BellRing, Building2, FileBarChart2, Scale, ShieldCheck } from 'lucide-react';

const offers = [
  {
    title: 'For lawyers',
    text: 'Pull repeat denial language, insurer over-index patterns, and ready-to-cite evidence packets for cases that need proof, not anecdotes.',
    icon: Scale,
  },
  {
    title: 'For hospitals and revenue-cycle teams',
    text: 'See which plans are slowing care, where prior auth clusters, and which denial reasons are driving the most repeat patient harm.',
    icon: Building2,
  },
  {
    title: 'For regulators and employers',
    text: 'Track insurer-level shifts, plan-type anomalies, and pressure points that deserve oversight before they become normal.',
    icon: BellRing,
  },
];

const productModules = [
  'Insurer-by-insurer denial share dashboards',
  'Treatment-specific excuse tracking and trend alerts',
  'Plan-type benchmark cuts for commercial, Marketplace, Medicaid, and Medicare Advantage',
  'Exportable briefs for litigation, advocacy, and board-level review',
];

const whatExistsToday = [
  {
    label: 'Free for patients',
    value: 'Search, compare, and use the public record without a paywall.',
  },
  {
    label: 'What organizations unlock',
    value: 'Benchmarks, alerts, exports, and deeper insurer-by-insurer visibility.',
  },
  {
    label: 'Privacy line',
    value: 'We do not sell raw patient identities. The value is in the patterns.',
  },
];

export default function B2BDataProducts() {
  return (
    <div className="min-h-screen bg-[#070b16] px-5 py-10 text-[#f5f7ff] md:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2.8rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_32%),linear-gradient(180deg,#091024_0%,#070b16_100%)] px-8 py-12 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:px-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8b8ff]">
                <FileBarChart2 className="h-3.5 w-3.5" />
                Data products
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-white md:text-6xl">
                Denial patterns insurers hope stay hidden.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[#c0c8e6]">
                We package the repeat offenses, insurer by insurer and excuse by excuse, so lawyers, hospitals, regulators,
                and employers can pressure the system with evidence that is actually usable.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="h-13 rounded-[1rem] bg-[#8b5cf6] px-7 text-base font-semibold text-white shadow-[0_18px_45px_rgba(139,92,246,0.28)] hover:bg-[#7b49ec]">
                  Request a demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'about' }))}
                  className="h-13 rounded-[1rem] border-white/10 bg-white/6 px-7 text-base font-semibold text-white hover:bg-white/10"
                >
                  View methodology and trust
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {whatExistsToday.map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bfb8ef]">{item.label}</p>
                  <p className="mt-3 text-base leading-7 text-[#d8def7]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {offers.map((offer, index) => (
            <motion.article
              key={offer.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-[2rem] border border-white/8 bg-[#0d1224] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.25)]"
            >
              <offer.icon className="h-8 w-8 text-[#8ea9ff]" />
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">{offer.title}</h2>
              <p className="mt-4 leading-7 text-[#c0c8e6]">{offer.text}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.3rem] border border-white/8 bg-[#0d1224] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#8ea9ff]" />
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">What this page is really offering</h3>
            </div>
            <div className="mt-6 space-y-4 text-[#d8def7]">
              <p className="leading-7">
                Patients should get the database for free. Organizations pay when they need the higher-resolution layer:
                insurer comparisons, exportable evidence packs, alerting, and oversight reporting.
              </p>
              <p className="leading-7">
                That means this page earns its place only if it explains a real product. No vague “intelligence platform”
                language. Just the concrete things a lawyer, hospital, or regulator can actually do with the data.
              </p>
            </div>
          </div>

          <div className="rounded-[2.3rem] border border-white/8 bg-[#0d1224] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bfb8ef]">What organizations would receive</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {productModules.map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
                  <FileBarChart2 className="mb-3 h-5 w-5 text-[#8ea9ff]" />
                  <p className="text-sm font-medium leading-6 text-[#d8def7]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
