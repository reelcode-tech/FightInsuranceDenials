import React from 'react';
import { ArrowRight, ExternalLink, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DenialRecord } from '@/src/types';
import { HOMEPAGE_NEWS } from '@/src/lib/appealGuidance';
import type { DemoCard, ProofPoint } from '@/src/lib/insightsPresentation';

type ObservatoryExperienceProps = {
  featuredStories: DenialRecord[];
  totalStories: number;
  topCategory: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onNavigate: (tab: 'share' | 'appeal' | 'insights') => void;
  onOpenRecordFromQuery: () => void;
  onStartStoryFromQuery: () => void;
  proofPoints?: ProofPoint[];
  demoCard?: DemoCard;
  confidenceNote?: string;
};

function storyHeadline(story: DenialRecord) {
  const insurer = story.insurer || story.extracted_insurer || 'An insurer';
  const procedure = story.procedure || story.procedure_condition || 'care';
  return `${insurer} denied ${procedure}`;
}

function storySummary(story: DenialRecord) {
  return (
    story.summary ||
    story.narrative ||
    story.denialReason ||
    story.denial_reason_raw ||
    'A patient shared how a denial disrupted care and what happened next.'
  );
}

export default function ObservatoryExperience({
  featuredStories,
  totalStories,
  topCategory,
  searchTerm,
  onSearchTermChange,
  onNavigate,
  onOpenRecordFromQuery,
  onStartStoryFromQuery,
  demoCard,
}: ObservatoryExperienceProps) {
  const liveStories = featuredStories.length
    ? featuredStories
    : [
        {
          id: 'fallback-1',
          insurer: 'UnitedHealthcare',
          planType: 'Employer coverage',
          procedure: 'Taltz',
          denialReason: 'Prior authorization',
          date: '',
          status: 'denied',
          narrative: '',
          tags: [],
          isPublic: true,
          createdAt: null,
          summary: 'A patient kept getting forced back through prior authorization loops for an inflammatory condition treatment that had already been working.',
        },
        {
          id: 'fallback-2',
          insurer: 'Blue Cross Blue Shield',
          planType: 'Marketplace',
          procedure: 'fertility treatment',
          denialReason: 'Coverage exclusion',
          date: '',
          status: 'denied',
          narrative: '',
          tags: [],
          isPublic: true,
          createdAt: null,
          summary: 'A couple shared how plan language and repeated denials kept pushing fertility treatment farther out of reach and more expensive.',
        },
        {
          id: 'fallback-3',
          insurer: 'Aetna',
          planType: 'Employer coverage',
          procedure: 'MRI',
          denialReason: 'Medical necessity',
          date: '',
          status: 'denied',
          narrative: '',
          tags: [],
          isPublic: true,
          createdAt: null,
          summary: 'A patient dealing with chronic pain documented how an imaging denial delayed specialist care and added weeks of uncertainty.',
        },
      ];

  const compactCount = totalStories > 0 ? totalStories.toLocaleString() : 'Growing daily';

  return (
    <div className="min-h-screen bg-[#060814] text-[#f4f3ff]">
      <section className="relative overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(117,92,255,0.22),transparent_28%),linear-gradient(180deg,#090d1f_0%,#0a1023_55%,#060814_100%)]">
        <div className="absolute inset-0 opacity-[0.16]" aria-hidden="true">
          <div className="h-full w-full bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.18)_12%,transparent_24%,transparent_100%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-20 text-center md:px-8 md:pb-28 md:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bcb7ea]">
            <Sparkles className="h-3.5 w-3.5" />
            Public insurance denial database
          </div>
          <div className="mt-8 max-w-4xl space-y-6">
            <h1 className="text-5xl font-semibold tracking-[-0.07em] text-white md:text-7xl">
              Millions of health insurance denials.
              <span className="mt-2 block bg-gradient-to-r from-[#f3ecff] via-[#8db3ff] to-[#9c73ff] bg-clip-text text-transparent">
                We help you fight back.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-[#bcb7d8] md:text-lg">
              Search for a denial like yours, see how often it happens, and turn scattered patient frustration into evidence, precedent, and action.
            </p>
          </div>

          <div className="mt-10 w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#0f1530]/86 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex min-h-16 flex-1 items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-5">
                <Search className="h-5 w-5 text-[#8ea9ff]" />
                <input
                  value={searchTerm}
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder={demoCard?.query || 'I have UnitedHealthcare and my plan denied Taltz. Has anyone else dealt with this?'}
                  className="h-14 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#8f96b5]"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onOpenRecordFromQuery}
                  className="h-14 rounded-[1.2rem] bg-[#8b5cf6] px-6 text-sm font-semibold text-white hover:bg-[#7b49ec]"
                >
                  Search the database
                </Button>
                <Button
                  variant="outline"
                  onClick={onStartStoryFromQuery}
                  className="h-14 rounded-[1.2rem] border-white/10 bg-white/6 px-6 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Share your story
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#989fbe]">
              <span>{compactCount} public stories ready to compare</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#70779c] md:block" />
              <span>Most common roadblock: {topCategory}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#70779c] md:block" />
              <span>Search by insurer, plan, drug, procedure, or denial reason</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8ea9ff]">Why now</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
              Denial news that actually matters if you are trying to respond.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="hidden items-center text-sm font-semibold text-[#bcb7ea] md:inline-flex"
          >
            Open evidence patterns <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {HOMEPAGE_NEWS.map((item) => (
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[2rem] border border-white/8 bg-[#0d1224] p-6 transition-transform duration-200 hover:-translate-y-1 hover:border-[#8b5cf6]/50"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8ea9ff]">{item.source}</p>
                <ExternalLink className="h-4 w-4 text-[#8f96b5] transition-colors group-hover:text-white" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#bcb7d8]">{item.summary}</p>
              <p className="mt-6 text-xs uppercase tracking-[0.24em] text-[#8087aa]">{item.published}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 md:px-8">
        <div className="rounded-[2.4rem] border border-white/8 bg-[#0b1020] p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8ea9ff]">Patient stories of resilience</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                Real people using data, documentation, and persistence to push back.
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate('share')}
              className="rounded-full border-white/10 bg-white/6 text-white hover:bg-white/10"
            >
              Add your story
            </Button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {liveStories.slice(0, 3).map((story) => (
              <article key={story.id} className="rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#201937] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#bea7ff]">
                    {story.insurer || 'Named payer'}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#848caf]">{story.planType || 'Plan noted'}</span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">{storyHeadline(story)}</h3>
                <p className="mt-4 text-sm leading-7 text-[#bcb7d8]">{storySummary(story)}</p>
                <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[#8f96b5]">
                  <span>{story.denialReason || 'Coverage denial'}</span>
                  {story.url ? (
                    <a href={story.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#bea7ff]">
                      Source <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button type="button" onClick={() => onNavigate('share')} className="text-[#bea7ff]">
                      Read story
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#080b16]">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center md:px-8">
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Ready to strike back?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#bcb7d8]">
            The database is live. The appeal help is getting smarter. The next step is to stop fighting your denial alone.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button onClick={() => onNavigate('appeal')} className="h-14 rounded-[1.15rem] bg-[#8b5cf6] px-8 text-base font-semibold text-white hover:bg-[#7b49ec]">
              Write your AI appeal
            </Button>
            <Button variant="outline" onClick={() => onNavigate('share')} className="h-14 rounded-[1.15rem] border-white/10 bg-white/6 px-8 text-base font-semibold text-white hover:bg-white/10">
              Share your story
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
