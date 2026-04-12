import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { DenialRecord } from '@/src/types';
import type { DemoCard, ProofPoint } from '@/src/lib/insightsPresentation';

interface Props {
  featuredStories: DenialRecord[];
  totalStories: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onNavigate: (tab: 'share' | 'appeal' | 'insights') => void;
  onOpenRecordFromQuery: () => void;
  onStartStoryFromQuery: () => void;
  proofPoints: ProofPoint[];
  confidenceNote: string;
  topCategory: string;
  demoCard: DemoCard;
}

const HERO_IMAGE =
  'https://images.pexels.com/photos/7299966/pexels-photo-7299966.jpeg?auto=compress&cs=tinysrgb&w=1800';

export default function ObservatoryExperience({
  featuredStories,
  totalStories,
  searchTerm,
  onSearchTermChange,
  onNavigate,
  onOpenRecordFromQuery,
  onStartStoryFromQuery,
  proofPoints,
  confidenceNote,
  demoCard,
}: Props) {
  const spotlight = featuredStories[0];

  return (
    <div className="min-h-screen bg-[#090b0f] text-[#f5efe7]">
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[3rem] border border-white/8 bg-[#0c1015] shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0">
            <img
              src={HERO_IMAGE}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center opacity-[0.14] grayscale"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,11,15,0.54)_0%,rgba(9,11,15,0.88)_52%,rgba(9,11,15,0.97)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(196,83,60,0.16),transparent_22%),linear-gradient(90deg,rgba(9,11,15,0.97)_0%,rgba(9,11,15,0.82)_52%,rgba(9,11,15,0.92)_100%)]" />
          </div>

          <div className="relative grid gap-8 px-7 py-10 md:px-10 md:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-16">
            <div className="space-y-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#f3a28d]">
                Public insurance denial database
              </p>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#f7f1ea] md:text-7xl"
              >
                Millions of health insurance denials.
                <br />
                We help you fight back.
              </motion.h1>

              <p className="max-w-2xl text-lg leading-relaxed text-[#d5cabf] md:text-xl">
                Search by insurer, plan, drug, procedure, or denial reason. Find the people, tactics, and appeal clues that make your denial easier to challenge.
              </p>

              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                <p className="px-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">
                  Start with the exact question already in your head
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95897f]" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => onSearchTermChange(e.target.value)}
                      placeholder={demoCard.query}
                      className="h-14 rounded-full border-white/10 bg-white/6 pl-11 text-sm text-[#f7f1ea] placeholder:text-[#95897f] shadow-none"
                    />
                  </div>
                  <Button
                    onClick={onOpenRecordFromQuery}
                    className="h-14 rounded-full bg-[#c2533c] px-8 text-sm font-semibold text-white hover:bg-[#b14733]"
                  >
                    Search the database
                  </Button>
                  <Button
                    onClick={onStartStoryFromQuery}
                    variant="outline"
                    className="h-14 rounded-full border-white/10 bg-white/6 px-8 text-sm font-semibold text-[#f7f1ea] hover:bg-white/10"
                  >
                    Start my story
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {proofPoints.map((point) => (
                  <div key={point.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f3a28d]">{point.eyebrow}</p>
                    <h2 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[#f7f1ea]">{point.title}</h2>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f3a28d]">
                    What a useful result looks like
                  </p>
                  <Sparkles className="h-4 w-4 text-[#f3a28d]" />
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#9f9388]">Example search</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#f7f1ea]">
                    {demoCard.query}
                  </p>
                </div>

                <div className="mt-5">
                  <h2 className="text-2xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">
                    {demoCard.headline}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#d5cabf]">{demoCard.subhead}</p>
                </div>

                <div className="mt-6 grid gap-3">
                  {demoCard.signals.map((signal) => (
                    <div
                      key={signal.label}
                      className="flex items-center justify-between rounded-[1.3rem] border border-white/8 bg-white/[0.04] px-4 py-3"
                    >
                      <span className="text-sm text-[#d5cabf]">{signal.label}</span>
                      <span className="text-sm font-semibold text-[#f7f1ea]">{signal.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-[2.2rem] border border-white/8 bg-[#10151b] p-7 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f3a28d]">Two ways in</p>
            <div className="mt-5 grid gap-4">
              <button
                onClick={() => onNavigate('share')}
                className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">Share your story</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Add what happened to you.</h3>
                <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">
                  Start with the story in your own words. Add the insurer, plan, and paperwork if you have it.
                </p>
              </button>

              <button
                onClick={() => onNavigate('appeal')}
                className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">Fight back</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Upload the denial and build the appeal.</h3>
                <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">
                  Use the denial letter, repeated insurer tactics, and similar cases to write something stronger than a generic AI draft.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-white/8 bg-[#11161b] p-7 md:p-8">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f3a28d]">Why this matters</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">
                  The goal is not more complaint noise. The goal is usable precedent.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#c7bdb4]">{confidenceNote}</p>

                <div className="mt-6 space-y-3">
                  {proofPoints.map((point) => (
                    <div key={point.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#f7f1ea]">{point.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#c7bdb4]">{point.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">Example from the database</p>
                {spotlight ? (
                  <>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border-0 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/82">
                        {spotlight.insurer || 'Private carrier'}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                        {spotlight.source || 'Public source'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">
                      {spotlight.procedure || 'Medical service denial'}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[#ddd1c6]">
                      {spotlight.summary || spotlight.denialReason}
                    </p>
                    {spotlight.url && (
                      <a
                        href={spotlight.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center text-sm font-semibold text-[#f3a28d]"
                      >
                        Source link <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-[#c7bdb4]">
                    The database is still warming up. As more specific stories come in, this becomes the fastest way to compare your case against a real one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
