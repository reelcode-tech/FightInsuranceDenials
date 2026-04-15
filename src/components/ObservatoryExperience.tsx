import React from 'react';
import { ArrowRight, ExternalLink, Search, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DenialRecord } from '@/src/types';
import { HOMEPAGE_NEWS } from '@/src/lib/appealGuidance';
import { buildStoryActionTag, buildStoryPreview, buildStorySummary, buildStoryTags, buildStoryTitle, buildWhatWasDenied } from '@/src/lib/storyPresentation';

type ObservatoryExperienceProps = {
  featuredStories: DenialRecord[];
  totalStories: number;
  topCategory: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onNavigate: (tab: 'share' | 'appeal' | 'insights') => void;
  onOpenRecordFromQuery: () => void;
  onStartStoryFromQuery: () => void;
};

const SEARCH_EXAMPLES = ['prior authorization...', 'MRI...', 'UnitedHealthcare...', 'ADHD medication...'];
const SEARCH_CHIPS = ['Prior Authorization', 'UnitedHealthcare', 'ADHD Medication', 'MRI'];

function storyBody(story: DenialRecord) {
  return (
    story.narrative ||
    story.summary ||
    story.denialReason ||
    story.denial_reason_raw ||
    'A patient documented how an insurer blocked care and what happened next.'
  )
    .replace(/\s+/g, ' ')
    .trim();
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
}: ObservatoryExperienceProps) {
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
  const [focused, setFocused] = React.useState(false);
  const [expandedStoryId, setExpandedStoryId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (searchTerm.trim()) return;
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % SEARCH_EXAMPLES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [searchTerm]);

  const liveStories = featuredStories.length
    ? featuredStories
    : [
        {
          id: 'fallback-1',
          insurer: 'UnitedHealthcare',
          planType: 'Choice Plus PPO',
          procedure: 'Taltz',
          denialReason: 'Prior authorization',
          date: '',
          status: 'denied',
          narrative: '',
          tags: [],
          isPublic: true,
          createdAt: null,
          summary: 'A patient with inflammatory disease kept getting forced back through prior authorization loops for a drug that had already been working.',
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
          summary: 'A couple documented how plan language and repeated denials kept pushing fertility treatment farther out of reach and more expensive.',
        },
        {
          id: 'fallback-3',
          insurer: 'Aetna',
          planType: 'Employer sponsored PPO',
          procedure: 'MRI',
          denialReason: 'Medical necessity',
          date: '',
          status: 'denied',
          narrative: '',
          tags: [],
          isPublic: true,
          createdAt: null,
          summary: 'A patient dealing with chronic pain showed how an imaging denial delayed specialist care and added weeks of uncertainty.',
        },
      ];

  const trendingSearches = React.useMemo(() => {
    const base = [topCategory, ...SEARCH_CHIPS, ...liveStories.map((story) => story.insurer || story.procedure).filter(Boolean)];
    return Array.from(new Set(base.filter(Boolean))).slice(0, 6);
  }, [liveStories, topCategory]);

  const searchSuggestions = React.useMemo(() => {
    const suggestions = [
      ...SEARCH_CHIPS,
      ...trendingSearches,
      ...liveStories.flatMap((story) => [
        buildStoryTitle(story),
        [story.insurer || story.extracted_insurer, story.planType || story.plan_type, story.procedure || story.procedure_condition]
          .filter(Boolean)
          .join(' - '),
      ]),
    ].filter(Boolean) as string[];

    const normalizedTerm = searchTerm.trim().toLowerCase();
    const filtered = normalizedTerm
      ? suggestions.filter((item) => item.toLowerCase().includes(normalizedTerm))
      : suggestions;
    return Array.from(new Set(filtered)).slice(0, 6);
  }, [liveStories, searchTerm, trendingSearches]);

  return (
    <div className="min-h-screen bg-[#070b16] text-[#f5f7ff]">
      <section className="relative overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(116,104,255,0.22),transparent_28%),linear-gradient(180deg,#070b16_0%,#091024_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.02)_0%,transparent_35%,rgba(255,255,255,0.02)_100%)]" />
        <div className="absolute inset-0 opacity-[0.14]" aria-hidden="true">
          <div className="absolute right-[-8%] top-[-12%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(211,89,89,0.35),transparent_58%)] blur-3xl" />
          <div className="absolute left-[-6%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(120,91,255,0.32),transparent_60%)] blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-20 pt-20 md:px-8 md:pb-28 md:pt-24">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#b9b6eb]">
              <Sparkles className="h-3.5 w-3.5" />
              Public insurance denial database
            </div>

            <div className="space-y-5">
              <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.07em] text-white md:text-7xl">
                Millions of health insurance denials.
                <span className="mt-2 block bg-gradient-to-r from-[#ffffff] via-[#9ed0ff] to-[#9f78ff] bg-clip-text text-transparent">
                  We help you fight back.
                </span>
              </h1>
              <div className="max-w-3xl space-y-2 text-lg leading-8 text-[#bac1e0]">
                <p>The first public database of real insurance denials.</p>
                <p>See how often your denial happens, how insurers justify it, and how other patients fought back.</p>
                <p>Turn your experience into evidence - and your evidence into action.</p>
              </div>
            </div>

            <div className="relative max-w-4xl rounded-[2rem] border border-white/10 bg-[#0d1430]/82 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex min-h-16 flex-1 items-center gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-5">
                  <Search className="h-5 w-5 text-[#8ea9ff]" />
                  <input
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                    placeholder={SEARCH_EXAMPLES[placeholderIndex]}
                    className="h-14 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#9098bd]"
                  />
                  {focused && searchSuggestions.length ? (
                    <div className="absolute left-3 right-3 top-[calc(100%+10px)] z-20 rounded-[1.4rem] border border-white/10 bg-[#11182f] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onSearchTermChange(suggestion);
                          }}
                          className="flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left text-sm text-[#dce1ff] transition-colors hover:bg-white/6"
                        >
                          <span>{suggestion}</span>
                          <ArrowRight className="h-4 w-4 text-[#7b84a9]" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button
                  onClick={onOpenRecordFromQuery}
                  className="h-14 rounded-[1.2rem] bg-[#8b5cf6] px-7 text-sm font-semibold text-white hover:bg-[#7b49ec]"
                >
                  Search the database
                </Button>
                <Button
                  variant="outline"
                  onClick={onStartStoryFromQuery}
                  className="h-14 rounded-[1.2rem] border-white/10 bg-white/6 px-7 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Start my story
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onSearchTermChange(chip)}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-[#dbe1ff] transition-colors hover:bg-white/10"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#96a6d9]">Trending searches</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        onSearchTermChange(term);
                        onOpenRecordFromQuery();
                      }}
                      className="rounded-full border border-white/10 bg-[#121a35] px-4 py-3 text-sm font-medium text-[#eff2ff] transition-colors hover:border-[#8b5cf6]/40 hover:bg-[#171f3d]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/8 bg-[#0d1328] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#96a6d9]">Search - Compare - Generate appeal</p>
                <div className="mt-5 space-y-3 text-sm leading-7 text-[#c4cbe8]">
                  <p><span className="font-semibold text-white">1.</span> Search for your insurer, plan, drug, procedure, or denial reason.</p>
                  <p><span className="font-semibold text-white">2.</span> See which excuses keep surfacing and how other patients pushed back.</p>
                  <p><span className="font-semibold text-white">3.</span> Turn that evidence into a stronger AI-guided appeal in minutes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#96a6d9]">Why now</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
              Why this moment matters if you are trying to fight a denial.
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('insights')}
            className="rounded-full border-white/10 bg-white/6 text-white hover:bg-white/10"
          >
            Open evidence patterns
          </Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {HOMEPAGE_NEWS.map((item) => (
            <article key={item.title} className="rounded-[2rem] border border-white/8 bg-[#0d1224] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a6b4e8]">{item.narrative}</p>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f3a08e]">
                  {item.source}
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#c4cbe8]">{item.summary}</p>
              <div className="mt-5 rounded-[1.4rem] border border-[#8b5cf6]/20 bg-[#121739] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a6b4e8]">Visual stat</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.stat}</p>
              </div>
              <blockquote className="mt-5 border-l-2 border-[#8b5cf6]/55 pl-4 text-sm italic leading-7 text-[#e8dfff]">
                {item.pullQuote}
              </blockquote>
              <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f3a08e]">What this means for you</p>
                <p className="mt-2 text-sm leading-7 text-[#d6dbf4]">{item.whatThisMeans}</p>
              </div>
              <a
                href={item.url}
                target={item.url.startsWith('http') ? '_blank' : undefined}
                rel={item.url.startsWith('http') ? 'noreferrer' : undefined}
                onClick={(event) => {
                  if (!item.url.startsWith('http')) {
                    event.preventDefault();
                    onNavigate('insights');
                  }
                }}
                className="mt-5 inline-flex items-center text-sm font-semibold text-[#bfa8ff]"
              >
                Read source <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8">
        <div className="rounded-[2.4rem] border border-white/8 bg-[#0d1224] p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#96a6d9]">Patient stories of resilience</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                Curated stories that show how people documented denials and kept pushing.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#bfc6e5]">
              Behind every denial is a person whose care was put on hold. These stories turn that isolation into precedent.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {['Autism assessment', 'Prescription medication', 'Medicaid', 'UnitedHealthcare'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  onSearchTermChange(filter);
                  onOpenRecordFromQuery();
                }}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[#e8ebff] transition-colors hover:bg-white/10"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {liveStories.slice(0, 3).map((story) => {
              const expanded = expandedStoryId === story.id;
              const tags = buildStoryTags(story);
              const title = (story as any).title || buildStoryTitle(story);
              const summary = story.preview || buildStoryPreview(story);
              const actionTag = (story as any).actionTag || buildStoryActionTag(story);
              const whatWasDenied = story.whatWasDenied || buildWhatWasDenied(story);
              return (
                <article key={story.id} className="flex h-full flex-col rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-6">
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 2).map((tag) => (
                      <span
                        key={`${story.id}-${tag}`}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d7dcf4]"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="rounded-full bg-[#301a18] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f3a08e]">
                      {actionTag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a39bfd]">
                    What was denied: {whatWasDenied}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[#c6cde8]">
                    {expanded ? storyBody(story) : summary}
                  </p>
                  {story.sourceConfidenceLabel ? (
                    <p className="mt-4 text-xs leading-6 text-[#9da7d1]">
                      {story.sourceConfidenceLabel}: {story.sourceTrustNote}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setExpandedStoryId(expanded ? null : story.id)}
                      className="text-sm font-semibold text-[#bfa8ff]"
                    >
                      {expanded ? 'Show less' : 'Read story'}
                    </button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onSearchTermChange(`${story.insurer || story.extracted_insurer || ''} ${story.procedure || story.procedure_condition || ''}`.trim());
                        onOpenRecordFromQuery();
                      }}
                      className="rounded-full border-white/10 bg-white/6 text-white hover:bg-white/10"
                    >
                      This matches my situation
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#060814]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#96a6d9]">Fight back</p>
              <h2 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Don't fight your denial alone. Build a data-backed appeal in minutes.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-[#bdc5e7]">
                Our AI uses patterns from thousands of real denials to help you write a stronger, more targeted appeal - grounded in evidence, not guesswork.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate('appeal')}
                  className="h-14 rounded-[1rem] bg-[#8b5cf6] px-8 text-base font-semibold text-white hover:bg-[#7b49ec]"
                >
                  Write your AI appeal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate('share')}
                  className="h-14 rounded-[1rem] border-white/10 bg-white/6 px-8 text-base font-semibold text-white hover:bg-white/10"
                >
                  Share your story
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-white/8 bg-[#0d1224] p-6">
                <div className="flex items-center gap-3 text-[#d8deff]">
                  <Wand2 className="h-5 w-5 text-[#8b5cf6]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]">AI appeal preview</p>
                </div>
                <div className="mt-5 grid gap-3">
                  {['Search your match', "Compare the insurer's language", 'Generate a stronger appeal'].map((step, index) => (
                    <div key={step} className="flex items-start gap-4 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1638] text-sm font-semibold text-[#d0b4ff]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-base font-semibold text-white">{step}</p>
                        <p className="mt-1 text-sm leading-6 text-[#bbc3e3]">
                          Move from "why did they do this?" to a draft that answers the insurer's actual reasoning.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-[#8b5cf6]/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(74,46,136,0.12))] p-6 text-[#eef0ff]">
                <p className="text-lg font-semibold">Used by {totalStories.toLocaleString() || '1,000+'} patients in the public record</p>
                <p className="mt-2 text-sm leading-7 text-[#d9ddf6]">
                  The strongest appeals start with specifics: your plan, your denial language, your treatment, and the patterns already in the database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
