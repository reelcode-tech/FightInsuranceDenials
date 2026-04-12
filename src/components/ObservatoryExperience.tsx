import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ExternalLink, Search } from 'lucide-react';
import { motion } from 'motion/react';
import type { DenialRecord } from '@/src/types';

type ProofPoint = {
  eyebrow: string;
  title: string;
  body: string;
};

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
}

const HERO_IMAGE =
  'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1800';

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
}: Props) {
  return (
    <div className="min-h-screen bg-[#090b0f] text-[#f5efe7]">
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/8 bg-[#0f1318] shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
          <div className="absolute inset-0">
            <img
              src={HERO_IMAGE}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center opacity-[0.16] grayscale"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,11,15,0.76)_0%,rgba(9,11,15,0.94)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(196,86,61,0.16),transparent_22%),linear-gradient(90deg,rgba(9,11,15,0.97)_0%,rgba(9,11,15,0.86)_40%,rgba(9,11,15,0.88)_100%)]" />
          </div>

          <div className="relative px-7 py-10 md:px-10 md:py-14 lg:px-12 lg:py-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#f1a28e]">Public insurance denial database</p>

            <div className="mt-6 max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-5xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#f7f1ea] md:text-7xl"
              >
                Millions of health insurance denials.
                <br />
                We help you fight back.
              </motion.h1>

              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#d5cabf] md:text-xl">
                Search for stories like yours, see how other patients were blocked, and turn that evidence into a smarter appeal instead of fighting the system alone.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate('share')}
                  className="h-16 rounded-full bg-[#c2533c] px-10 text-base font-semibold text-white shadow-[0_14px_40px_rgba(194,83,60,0.24)] hover:bg-[#b14733]"
                >
                  Share your story <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onNavigate('appeal')}
                  variant="outline"
                  className="h-16 rounded-full border-white/10 bg-white/6 px-10 text-base font-semibold text-[#f7f1ea] hover:bg-white/10"
                >
                  Fight back with AI
                </Button>
              </div>

              <div className="mt-8 max-w-4xl rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                <p className="px-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1a28e]">
                  Try a real denial search
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95897f]" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => onSearchTermChange(e.target.value)}
                      placeholder='I have UnitedHealthcare Choice Plus and got denied Taltz. Anyone else?'
                      className="h-14 rounded-full border-white/10 bg-white/6 pl-11 text-sm text-[#f7f1ea] placeholder:text-[#95897f] shadow-none"
                    />
                  </div>
                  <Button
                    onClick={onOpenRecordFromQuery}
                    className="h-14 rounded-full bg-[#f7f1ea] px-7 text-sm font-semibold text-[#11151a] hover:bg-[#ece4d9]"
                  >
                    Search the database
                  </Button>
                  <Button
                    onClick={onStartStoryFromQuery}
                    variant="outline"
                    className="h-14 rounded-full border-white/10 bg-white/6 px-7 text-sm font-semibold text-[#f7f1ea] hover:bg-white/10"
                  >
                    Start my story
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 px-2 text-sm text-[#c8beb4]">
                  <span>{totalStories.toLocaleString()} patient stories already in the record</span>
                  <span className="text-white/25">•</span>
                  <span>{topCategory} is surfacing the most</span>
                  <span className="text-white/25">•</span>
                  <span>Built to help patients, reporters, and watchdogs spot repeat insurer behavior</span>
                </div>
              </div>

              <div className="mt-7 flex max-w-3xl flex-wrap gap-3 text-sm text-[#c8beb4]">
                <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                  Search by insurer, plan, drug, procedure, or denial reason
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                  Pull examples before you upload a denial letter
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                  Carry your search straight into Share Your Story
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {proofPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.06, duration: 0.34 }}
              className="rounded-[1.8rem] border border-white/8 bg-[#12171d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f1a28e]">{point.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">{point.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">{point.body}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.3rem] border border-white/8 bg-[#11161b] p-7 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f1a28e]">What this site is for</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">
              Collect the story. Then use the record to fight back smarter.
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f1a28e]">Share your story</p>
                <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Start with what happened to you.</h4>
                <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">
                  Vent first. Add structure second. We turn patient stories into a record other people can search for precedent, patterns, and what worked.
                </p>
                <Button onClick={() => onNavigate('share')} className="mt-5 rounded-full bg-[#c2533c] text-white hover:bg-[#b14733]">
                  Share your story
                </Button>
              </div>

              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f1a28e]">Fight back</p>
                <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Bring the denial letter when you are ready to act.</h4>
                <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">
                  That is where we use similar cases, insurer patterns, and AI to help draft a stronger appeal instead of making you decode the small print alone.
                </p>
                <Button onClick={() => onNavigate('appeal')} variant="outline" className="mt-5 rounded-full border-white/10 bg-white/6 text-[#f7f1ea] hover:bg-white/10">
                  Fight back with AI
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[2.3rem] border border-white/8 bg-[#11161b] p-7 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f1a28e]">From the current record</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">Open these first if you want to see what denial looks like in the wild</h3>
              </div>
              <Button variant="ghost" className="rounded-full px-0 text-[#f1a28e]" onClick={() => onNavigate('insights')}>
                Open evidence patterns
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {featuredStories.slice(0, 2).map((story) => (
                <article key={story.id} className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge className="rounded-full border-0 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/82">
                      {story.insurer || 'Private carrier'}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">{story.source || 'Public source'}</span>
                  </div>
                  <h4 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#f7f1ea]">{story.procedure || 'Medical service denial'}</h4>
                  <p className="mt-3 text-sm leading-7 text-[#c7bdb4]">{story.summary || story.denialReason}</p>
                  {story.url && (
                    <a href={story.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-sm font-semibold text-[#f1a28e]">
                      Source link <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/8 bg-[#10151b] px-6 py-5 text-sm leading-7 text-[#b9afa6]">
          {confidenceNote}
        </section>
      </main>
    </div>
  );
}
