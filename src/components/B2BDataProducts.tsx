import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { ArrowRight, BellRing, Building2, FileBarChart2, Scale, ShieldCheck } from 'lucide-react';

const offers = [
  {
    title: 'For lawyers',
    text: 'Find insurer-specific denial clusters, repeated appeal failures, and jurisdiction-aware evidence packs for litigation and class-action discovery.',
    icon: Scale,
  },
  {
    title: 'For hospitals and RCM teams',
    text: 'See which plans are delaying payment, leaning on prior auth, or using coverage language in ways that break trust with patients and providers.',
    icon: Building2,
  },
  {
    title: 'For regulators and employers',
    text: 'Track denial spikes, trend shifts, and category anomalies with reporting built for oversight instead of marketing fluff.',
    icon: BellRing,
  },
];

export default function B2BDataProducts() {
  return (
    <div className="min-h-screen bg-[#f4efe8] px-5 py-12 md:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="grid gap-8 rounded-[2.5rem] bg-[#1d1714] px-8 py-10 text-white md:grid-cols-[1.1fr_0.9fr] md:px-12 md:py-14">
          <div className="space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#e9b08e]">Data products</p>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
              Serious denial intelligence for the people who can pressure the system.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/72">
              We do not sell raw patient identities. We package the patterns: where denials cluster, what language repeats,
              and where insurers seem to be shifting tactics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full bg-[#b43c2e] text-white hover:bg-[#9f3226]">
                Request a demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-full border-white/12 bg-transparent text-white hover:bg-white/6">
                View methodology
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Observatory records', value: '500+' },
              { label: 'Insurer pattern groups', value: 'Growing weekly' },
              { label: 'Exports', value: 'CSV + custom briefs' },
              { label: 'Privacy stance', value: 'No raw PHI sales' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] uppercase tracking-[0.26em] text-white/45">{item.label}</p>
                <p className="mt-3 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {offers.map((offer, index) => (
            <motion.article
              key={offer.title}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-[2rem] border border-black/8 bg-white/75 p-7"
            >
              <offer.icon className="h-8 w-8 text-[#b43c2e]" />
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#1f1b17]">{offer.title}</h2>
              <p className="mt-4 leading-relaxed text-[#574a40]">{offer.text}</p>
            </motion.article>
          ))}
        </section>

        <section className="rounded-[2.25rem] border border-black/8 bg-[#eadfce] p-8">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a5a49]">What we package</p>
              <h3 className="text-3xl font-bold tracking-tight text-[#1f1b17]">Pattern packs, anomaly alerts, and exportable evidence.</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Insurer-by-insurer denial summaries',
                'Procedure and category trend dashboards',
                'State and plan-type benchmark cuts',
                'Narrative evidence packets for advocacy',
              ].map((item) => (
                <div key={item} className="rounded-[1.35rem] border border-black/8 bg-white/75 p-5 text-[#574a40]">
                  <FileBarChart2 className="mb-3 h-5 w-5 text-[#b43c2e]" />
                  <p className="font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

