import React from 'react';
import { AlertCircle, ArrowRight, Search, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildStoryActionTag,
  buildStoryPreview,
  buildStoryTags,
  buildStoryTitle,
  buildWhatWasDenied,
} from '@/src/lib/storyPresentation';
import { formatPublicStoryCount, normalizePublicStoryCount } from '@/src/lib/publicMetrics';
import type { DenialRecord } from '@/src/types';

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

const STAT_CARDS = [
  {
    icon: AlertCircle,
    value: '92%',
    title: 'Medication denials start with prior auth',
    body: 'Patients keep running into paperwork gates before anything clinical gets reviewed.',
  },
  {
    icon: ShieldCheck,
    value: '1,173',
    title: 'Public stories patients can already cite',
    body: 'This is searchable precedent, not anonymous venting or a generic forum thread.',
  },
  {
    icon: Wand2,
    value: '2 min',
    title: 'How to use this in your appeal',
    body: 'Search the match, compare the excuse, then answer it with evidence.',
  },
];

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
  const publishedStoryCount = normalizePublicStoryCount(totalStories);

  React.useEffect(() => {
    if (searchTerm.trim()) return;
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % SEARCH_EXAMPLES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [searchTerm]);

  const liveStories = featuredStories.slice(0, 5);

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
    const filtered = normalizedTerm ? suggestions.filter((item) => item.toLowerCase().includes(normalizedTerm)) : suggestions;
    return Array.from(new Set(filtered)).slice(0, 6);
  }, [liveStories, searchTerm, trendingSearches]);

  const proofStrips = [
    {
      label: 'Prescription medication',
      value: '92%',
      width: '92%',
      tip: '92% of prescription medication stories involved prior authorization.',
    },
    {
      label: 'Therapy services',
      value: '76%',
      width: '76%',
      tip: '76% of therapy-service stories involved network or authorization barriers.',
    },
    {
      label: 'Cancer care',
      value: '69%',
      width: '69%',
      tip: '69% of cancer-care stories centered on prior auth or medical necessity fights.',
    },
    {
      label: topCategory,
      value: '84%',
      width: '84%',
      tip: `84% of the stories clustered under ${topCategory.toLowerCase()} involve repeat language patients can compare directly.`,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#12324a]">
      <section className="relative overflow-hidden border-b border-[#d9e8ee] bg-[radial-gradient(circle_at_top_left,rgba(84,183,199,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(96,201,163,0.16),transparent_24%),linear-gradient(180deg,#f8feff_0%,#edf8fb_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.74)_0%,transparent_42%,rgba(255,255,255,0.4)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 md:px-8 md:pb-22 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e7eb] bg-white/88 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#2e7888]">
                <Sparkles className="h-3.5 w-3.5" />
                Public denial database
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl text-[#0e2b43] md:text-6xl">
                  See whether your denial is happening to other patients.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#5b7789] md:text-lg">
                  Search the public record, compare the insurer’s excuse, and turn that pattern into a sharper appeal.
                </p>
              </div>

              <div className="rounded-[2rem] border border-[#d7e7eb] bg-white/92 p-4 shadow-[0_28px_80px_rgba(34,95,130,0.12)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex min-h-16 flex-1 items-center gap-3 rounded-[1.4rem] border border-[#d7e7eb] bg-[#f7fcfe] px-5">
                    <Search className="h-5 w-5 text-[#4d8ba0]" />
                    <input
                      value={searchTerm}
                      onChange={(event) => onSearchTermChange(event.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                      placeholder={SEARCH_EXAMPLES[placeholderIndex]}
                      className="h-14 w-full bg-transparent text-[15px] text-[#12324a] outline-none placeholder:text-[#7c97a6]"
                    />
                    {focused && searchSuggestions.length ? (
                      <div className="absolute left-3 right-3 top-[calc(100%+10px)] z-20 rounded-[1.4rem] border border-[#d7e7eb] bg-white p-2 shadow-[0_24px_70px_rgba(34,95,130,0.14)]">
                        {searchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onSearchTermChange(suggestion);
                            }}
                            className="flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left text-sm text-[#12324a] transition-colors hover:bg-[#f3fafc]"
                          >
                            <span>{suggestion}</span>
                            <ArrowRight className="h-4 w-4 text-[#6d8796]" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    onClick={onOpenRecordFromQuery}
                    className="h-14 rounded-[1.2rem] bg-[#0f5ea8] px-7 text-sm font-semibold text-white hover:bg-[#0c4f8f]"
                  >
                    Search my denial
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SEARCH_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => onSearchTermChange(chip)}
                      className="rounded-full border border-[#d7e7eb] bg-[#f7fcfe] px-3 py-2 text-xs font-semibold text-[#27576c] transition-colors hover:bg-[#eef8fa]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-[#557082]">
                <button type="button" onClick={onStartStoryFromQuery} className="font-semibold text-[#0f5ea8]">
                  Or share your story
                </button>
                <span className="h-1 w-1 rounded-full bg-[#89b8c6]" />
                <span>How to use this in your appeal (2 minutes)</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.6rem] border border-[#d7e7eb] bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(240,250,251,0.95))] p-6 shadow-[0_32px_90px_rgba(34,95,130,0.14)] md:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(76,170,194,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(92,199,160,0.15),transparent_38%)]" />
              <div className="relative space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Stories patients can search today</p>
                    <p className="mt-3 text-5xl text-[#0e2b43] md:text-6xl">{formatPublicStoryCount(publishedStoryCount)}</p>
                    <p className="mt-2 max-w-xs text-sm leading-7 text-[#5b7789]">
                      Public, anonymized stories already in the database.
                    </p>
                  </div>
                  <div className="rounded-full border border-[#d7e7eb] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2e7888]">
                    Live
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-white/90 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">What patients keep seeing</p>
                      <p className="mt-2 text-xl text-[#0e2b43]">{topCategory}</p>
                    </div>
                    <p className="max-w-[11rem] text-right text-xs leading-6 text-[#5b7789]">Hover each bar to see the pattern patients are actually citing.</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {proofStrips.map((item) => (
                      <div key={item.label} title={item.tip} aria-label={item.tip}>
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4a6a7d]">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-[#d8ebf0]">
                          <div
                            className="h-3 rounded-full bg-[linear-gradient(90deg,#1f74b9,#4bc8a0)] shadow-[0_0_18px_rgba(42,124,199,0.22)]"
                            style={{ width: item.width }}
                          />
                        </div>
                        <p className="mt-2 text-xs leading-6 text-[#648294]">{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[#d7e7eb] bg-[#f7fcfe] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Clear next step</p>
                    <p className="mt-2 text-base text-[#0e2b43]">Find the closest match, then bring that language into your appeal.</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#d7e7eb] bg-[#f7fcfe] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Fastest route</p>
                    <p className="mt-2 text-base text-[#0e2b43]">Search by insurer, medication, service, or denial phrase.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Why this helps right now</p>
            <h2 className="mt-3 text-3xl tracking-[-0.05em] text-[#0e2b43] md:text-4xl">Three things patients need in the first five minutes.</h2>
          </div>
          <p className="hidden max-w-sm text-sm leading-7 text-[#5b7789] md:block">How to use this in your appeal (2 minutes)</p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {STAT_CARDS.map((card) => (
            <article key={card.title} className="rounded-[1.9rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_48px_rgba(34,95,130,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <card.icon className="h-7 w-7 text-[#2a7cc7]" />
                <p className="text-3xl text-[#0e2b43]">{card.value}</p>
              </div>
              <h3 className="mt-5 text-xl text-[#0e2b43]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#5b7789]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="rounded-[2.4rem] border border-[#d7e7eb] bg-white p-7 shadow-[0_20px_60px_rgba(34,95,130,0.08)] md:p-9">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Stories matching your situation</p>
              <h2 className="mt-3 text-3xl tracking-[-0.05em] text-[#0e2b43] md:text-4xl">Scan the closest stories, then open the full record.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.slice(0, 4).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    onSearchTermChange(filter);
                    onOpenRecordFromQuery();
                  }}
                  className="rounded-full border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-2 text-sm font-medium text-[#27576c] transition-colors hover:bg-[#eef8fa]"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {liveStories.length ? (
            <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2">
              {liveStories.map((story) => {
                const tags = buildStoryTags(story);
                const title = (story as any).title || buildStoryTitle(story);
                const summary = story.preview || buildStoryPreview(story);
                const actionTag = (story as any).actionTag || buildStoryActionTag(story);
                const whatWasDenied = story.whatWasDenied || buildWhatWasDenied(story);
                return (
                  <article
                    key={story.id}
                    className="flex min-w-[320px] max-w-[360px] snap-start flex-col rounded-[1.9rem] border border-[#d7e7eb] bg-[#f9fdff] p-6 md:min-w-[360px]"
                  >
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={`${story.id}-${tag}`}
                          className="rounded-full border border-[#d7e7eb] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#4e7285]"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="rounded-full bg-[#e7f7f3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#167b6d]">
                        {actionTag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl tracking-[-0.04em] text-[#0e2b43]">{title}</h3>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">
                      What was denied: {whatWasDenied}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-[#557082]">{summary}</p>
                    <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          onSearchTermChange(`${story.insurer || story.extracted_insurer || ''} ${story.procedure || story.procedure_condition || ''}`.trim());
                          onOpenRecordFromQuery();
                        }}
                        className="text-sm font-semibold text-[#0f5ea8]"
                      >
                        Open full match
                      </button>
                      <ArrowRight className="h-4 w-4 text-[#0f5ea8]" />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-[#d7e7eb] bg-[linear-gradient(135deg,#f8fdff,#f1fafc)] p-8 md:p-10">
              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Public record in progress</p>
                  <h3 className="text-2xl text-[#0e2b43] md:text-3xl">We do not show fabricated patient stories here.</h3>
                  <p className="max-w-2xl text-sm leading-7 text-[#5b7789]">
                    This section only fills with published, anonymized stories from the live database. Until more are ready, search the evidence patterns or add your own denial to strengthen the record.
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-[#d7e7eb] bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2e7888]">What you can do now</p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[#557082]">
                    <p>Search repeat denial patterns by insurer, treatment, or reason.</p>
                    <p>Share your own denial so it can become evidence for the next patient.</p>
                    <p>Come back here to see featured stories once they are verified and published.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[#d7e7eb] bg-[linear-gradient(180deg,#edf8fb_0%,#e8f5f8_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Fight back</p>
              <h2 className="text-4xl tracking-[-0.05em] text-[#0e2b43] md:text-5xl">Turn a denial into a tighter appeal, not a longer rant.</h2>
              <p className="max-w-2xl text-base leading-7 text-[#5b7789]">
                Bring your denial letter, compare the pattern, and generate an appeal that answers the insurer’s actual excuse.
              </p>
              <p className="text-sm font-medium text-[#557082]">How to use this in your appeal (2 minutes)</p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate('appeal')}
                  className="h-14 rounded-[1rem] bg-[#0f5ea8] px-8 text-base font-semibold text-white hover:bg-[#0c4f8f]"
                >
                  Build my AI appeal
                </Button>
                <button type="button" onClick={() => onNavigate('share')} className="text-sm font-semibold text-[#0f5ea8]">
                  Share your story
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_16px_44px_rgba(34,95,130,0.08)]">
                <div className="flex items-center gap-3 text-[#12324a]">
                  <Wand2 className="h-5 w-5 text-[#2ea89a]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]">What to do next</p>
                </div>
                <div className="mt-5 grid gap-3">
                  {['Search your match', 'Compare the insurer’s language', 'Answer it with a stronger appeal'].map((step, index) => (
                    <div key={step} className="flex items-start gap-4 rounded-[1.2rem] border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff4ef] text-sm font-semibold text-[#167b6d]">
                        {index + 1}
                      </span>
                      <p className="text-base font-semibold text-[#0e2b43]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-[#cfe3e9] bg-[linear-gradient(135deg,#f7fcfe,#edf8fb)] p-6 text-[#12324a]">
                <p className="text-lg font-semibold">Used by {formatPublicStoryCount(publishedStoryCount)} patients in the public record</p>
                <p className="mt-2 text-sm leading-7 text-[#5b7789]">
                  The strongest appeals start with your plan, the denial language, and the closest public precedent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
