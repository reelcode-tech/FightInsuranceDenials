import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, ShieldCheck } from 'lucide-react';

const sources = [
  { label: 'Patient uploads', weight: 'Highest confidence', tone: 'bg-emerald-500/15 text-emerald-300' },
  { label: 'ProPublica investigations', weight: 'Curated systemic signal', tone: 'bg-amber-500/15 text-amber-200' },
  { label: 'CMS / state appeals data', weight: 'Policy and benchmark layer', tone: 'bg-sky-500/15 text-sky-200' },
  { label: 'Public forums', weight: 'Narrative evidence, lower weight', tone: 'bg-white/10 text-stone-200' },
];

export default function SourceSignalPanel() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
      <div className="rounded-[2rem] border border-white/8 bg-[#101112] p-8 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#d8bb8c]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#d8bb8c]">Signal Strategy</p>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
          Not all public data should count the same.
        </h3>
        <p className="text-stone-300 font-light leading-relaxed">
          The observatory should weight official records, curated investigations, and verified patient uploads above generic forum chatter. That is how we get to insights that are useful instead of noisy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <div key={source.label} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 space-y-3">
              <Badge className={`${source.tone} border-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.25em]`}>
                {source.label}
              </Badge>
              <p className="text-sm text-stone-300">{source.weight}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(183,141,84,0.28),rgba(13,14,15,1)_60%)] p-8 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-white" />
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80">Why It Matters</p>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          The value is in the cross-source pattern.
        </h3>
        <p className="text-stone-200 font-light leading-relaxed">
          One patient story is heartbreaking. One hundred aligned stories, tied to the same insurer logic and public benchmark data, becomes a system map.
        </p>
        <Button
          variant="outline"
          className="h-12 rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/5 font-bold"
          onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'appeal' }))}
        >
          Generate an appeal <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
