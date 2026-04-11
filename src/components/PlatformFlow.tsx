import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, FileSearch, Scale, WandSparkles } from 'lucide-react';
import { motion } from "motion/react";

const steps = [
  {
    icon: Database,
    eyebrow: 'Collect',
    title: 'Pull public evidence from fragmented sources',
    body: 'We combine public stories, curated investigations, policy datasets, and user uploads into one denial observatory with source provenance.',
  },
  {
    icon: FileSearch,
    eyebrow: 'Normalize',
    title: 'Clean the noise into structured denial records',
    body: 'Every record gets tagged with insurer, category, appeal timing, signal quality, and source confidence so junk stays out of the core observatory.',
  },
  {
    icon: Scale,
    eyebrow: 'Benchmark',
    title: 'Compare one denial against the larger pattern',
    body: 'Patients should be able to see whether a denial matches known insurer behavior, external appeal trends, or medical-necessity disputes.',
  },
  {
    icon: WandSparkles,
    eyebrow: 'Act',
    title: 'Turn evidence into appeal drafts and public accountability',
    body: 'The same dataset powers appeal letters, legal context, trend dashboards, and anomaly detection that shows where denial tactics cluster.',
  },
];

export default function PlatformFlow() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#b78d54]">Platform Flow</p>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[0.95]">
          From scattered denial stories to evidence patients can use.
        </h2>
        <p className="text-lg md:text-xl text-stone-300 font-light leading-relaxed">
          This product only works if the backend becomes a disciplined evidence pipeline. The observatory has to collect broadly, clean aggressively, and surface patterns that matter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.55 }}
            className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 md:p-10"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b78d54] text-black">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-stone-500">0{index + 1}</span>
            </div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#d8bb8c]">{step.eyebrow}</p>
            <h3 className="mb-4 text-2xl font-bold tracking-tight text-white">{step.title}</h3>
            <p className="text-sm md:text-base font-light leading-relaxed text-stone-300">{step.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          size="lg"
          className="h-14 rounded-full bg-[#b78d54] px-8 text-black hover:bg-[#cda673] font-bold"
          onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'share' }))}
        >
          Submit a denial <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-full border-white/10 bg-transparent px-8 text-white hover:bg-white/5 font-bold"
          onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'insights' }))}
        >
          Explore the observatory
        </Button>
      </div>
    </section>
  );
}
