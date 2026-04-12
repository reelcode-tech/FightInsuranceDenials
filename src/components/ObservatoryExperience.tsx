import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ExternalLink, Search, Sparkles } from 'lucide-react';
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
  topCategory,
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
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,11,15,0.66)_0%,rgba(9,11,15,0.9)_55%,rgba(9,11,15,0.98)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(208,97,73,0.18),transparent_22%),linear-gradient(90deg,rgba(9,11,15,0.96)_0%,rgba(9,11,15,0.84)_46%,rgba(9,11,15,0.9)_100%)]" />
          </div>

          <div className="relative grid gap-8 px-7 py-10 md:px-10 md:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-16">
            <div className="max-w-4xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#f3a28d]">
                Public insurance denial database
              </p>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-6 text-5xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#f7f1ea] md:text-7xl"
              >
                Millions of health insurance denials.
                <br />
                We help you fight back.
              </motion.h1>

              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#d5cabf] md:text-xl">
                Search by insurer, plan, drug, procedure, or denial reason. Find people who ran into the same wall. Then decide whether to share your story or use the database to build a stronger appeal.
              </p>

              <div className="mt-9 rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
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

              <div className="mt-7 flex flex-wrap gap-4 text-sm text-[#d5cabf]">
                <span>{totalStories.toLocaleString()} published stories already in the database</span>
                <span className="text-white/25">•</span>
                <span>{topCategory} is the strongest repeat denial tactic right now</span>
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

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    onClick={onNavigate.bind(null, 'insights')}
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/6 text-[#f7f1ea] hover:bg-white/10"
                  >
                    Explore evidence patterns
                  </Button>
                  <Button
                    onClick={onNavigate.bind(null, 'appeal')}
                    className="rounded-full bg-[#f7f1ea] text-[#11151a] hover:bg-[#ece4d9]"
                  >
                    Build an appeal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-[2.2rem] border border-white/8 bg-[#10151b] p-7 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f3a28d]">What people use this for</p>
            <div className="mt-5 space-y-5">
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">Share your story</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Add what happened to you.</h3>
                <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">
                  Start with the story in your own words. Add paperwork if you want. Help other patients find a precedent instead of wondering if they are the only one.
                </p>
                <Button onClick={() => onNavigate('share')} className="mt-5 rounded-full bg-[#c2533c] text-white hover:bg-[#b14733]">
                  Share your story
                </Button>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">Fight back</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Turn the database into a better appeal.</h3>
                <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">
                  Upload the denial letter when you are ready to act. We pull forward similar stories, recurring insurer tactics, and the evidence patients needed most.
                </p>
                <Button onClick={() => onNavigate('appeal')} variant="outline" className="mt-5 rounded-full border-white/10 bg-white/6 text-[#f7f1ea] hover:bg-white/10">
                  Fight back with AI
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-white/8 bg-[#11161b] p-7 md:p-8">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f3a28d]">What is already surfacing</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">
                  Use the record to see what keeps happening before you upload anything.
                </h2>
                <div className="mt-6 space-y-4">
                  {proofPoints.map((point) => (
                    <div key={point.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">{point.eyebrow}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">{point.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#c7bdb4]">{point.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f3a28d]">Example from the record</p>
                {spotlight ? (
                  <>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border-0 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/82">
                        {spotlight.insurer || 'Private carrier'}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">{spotlight.source || 'Public source'}</span>
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
                    The record is still warming up. As more specific stories come in, this spotlight becomes the fastest way to see what a comparable case actually looks like.
                  </p>
                )}

                <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-black/18 p-4 text-sm leading-7 text-[#c7bdb4]">
                  {confidenceNote}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
