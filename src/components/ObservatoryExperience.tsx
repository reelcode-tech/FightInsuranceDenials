import React from 'react';
import { ArrowRight, ExternalLink, Search, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOMEPAGE_NEWS } from '@/src/lib/appealGuidance';
import { buildStoryActionTag, buildStoryPreview, buildStoryTags, buildStoryTitle, buildWhatWasDenied } from '@/src/lib/storyPresentation';
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

  React.useEffect(() => {
    if (searchTerm.trim()) return;
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % SEARCH_EXAMPLES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [searchTerm]);

  const liveStories = featuredStories.slice(0, 3);

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

  const proofStrips = [
    { label: 'Prescription meds', width: '92%' },
    { label: 'Therapy services', width: '76%' },
    { label: 'Cancer care', width: '69%' },
    { label: topCategory, width: '84%' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#12324a]">
      <section className="relative overflow-hidden border-b border-[#d9e8ee] bg-[radial-gradient(circle_at_top_left,rgba(85,188,204,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(103,204,156,0.16),transparent_24%),linear-gradient(180deg,#f8feff_0%,#edf8fb_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.65)_0%,transparent_38%,rgba(255,255,255,0.4)_100%)]" />
        <div className="absolute inset-0 opacity-[0.7]" aria-hidden="true">
          <div className="absolute right-[-8%] top-[-12%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(69,168,196,0.2),transparent_58%)] blur-3xl" />
          <div className="absolute left-[-6%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(83,190,150,0.18),transparent_60%)] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:px-8 md:pb-28 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e7eb] bg-white/88 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#2e7888]">
              <Sparkles className="h-3.5 w-3.5" />
              Public insurance denial database
            </div>

            <div className="space-y-5">
              <h1 className="max-w-5xl text-5xl text-[#0e2b43] md:text-7xl">
                Millions of health insurance denials.
                <span className="mt-2 block bg-gradient-to-r from-[#0e2b43] via-[#1670a3] to-[#2ea89a] bg-clip-text text-transparent">
                  We help you fight back.
                </span>
              </h1>
              <div className="max-w-3xl space-y-2 text-lg leading-8 text-[#5b7789]">
                <p>The first public database of real insurance denials.</p>
                <p>See how often your denial happens, how insurers justify it, and how other patients fought back.</p>
                <p>Turn your experience into evidence - and your evidence into action.</p>
              </div>
            </div>

            <div className="relative max-w-4xl rounded-[2rem] border border-[#d7e7eb] bg-white/90 p-4 shadow-[0_30px_90px_rgba(34,95,130,0.12)] backdrop-blur-xl">
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
                  Search the database
                </Button>
                <Button
                  variant="outline"
                  onClick={onStartStoryFromQuery}
                  className="h-14 rounded-[1.2rem] border-[#d7e7eb] bg-white px-7 text-sm font-semibold text-[#12324a] hover:bg-[#f4fbfd]"
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
                    className="rounded-full border border-[#d7e7eb] bg-[#f7fcfe] px-3 py-2 text-xs font-semibold text-[#27576c] transition-colors hover:bg-[#eef8fa]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_16px_44px_rgba(34,95,130,0.08)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Trending searches</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        onSearchTermChange(term);
                        onOpenRecordFromQuery();
                      }}
                      className="rounded-full border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-3 text-sm font-medium text-[#12324a] transition-colors hover:border-[#5bbccc]/40 hover:bg-[#eef8fa]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-[linear-gradient(180deg,#f9fdff_0%,#eef8fb_100%)] p-6 shadow-[0_16px_44px_rgba(34,95,130,0.08)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Live public record</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-[#d7e7eb] bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#4d8ba0]">Published stories</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#0e2b43]">{totalStories.toLocaleString() || '0'}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[#d7e7eb] bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#4d8ba0]">Top denial reason</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[#0e2b43]">{topCategory}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-[1.4rem] border border-[#cfe3e9] bg-white p-4 text-sm leading-7 text-[#5b7789]">
                  Search the record, compare the pattern, then turn that evidence into a stronger appeal.
                </div>
              </div>
            </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.4rem] border border-[#d7e7eb] bg-[linear-gradient(165deg,rgba(255,255,255,0.88),rgba(243,251,252,0.95))] p-6 shadow-[0_30px_90px_rgba(34,95,130,0.14)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(73,169,196,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(83,190,150,0.16),transparent_36%)]" />
              <div className="relative space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Live denial signal</p>
                    <p className="mt-3 max-w-xs text-4xl text-[#0e2b43] md:text-5xl">{totalStories.toLocaleString() || '0'}</p>
                    <p className="mt-2 text-sm leading-7 text-[#587386]">Published, anonymized stories patients can already search and compare.</p>
                  </div>
                  <div className="rounded-full border border-[#d7e7eb] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2e7888]">
                    Live
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-white/88 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">What the record is showing first</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:items-center">
                    <div className="rounded-[1.5rem] border border-[#d7e7eb] bg-[#f7fcfe] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2e7888]">Top denial reason</p>
                      <p className="mt-3 text-2xl text-[#0e2b43]">{topCategory}</p>
                    </div>
                    <div className="space-y-3">
                      {proofStrips.map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4a6a7d]">
                            <span>{item.label}</span>
                            <span>{item.width}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-[#d9ebee]">
                            <div
                              className="h-2 rounded-full bg-[linear-gradient(90deg,#2a7cc7,#2ea89a)] shadow-[0_0_18px_rgba(42,124,199,0.24)]"
                              style={{ width: item.width }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[#d7e7eb] bg-[#f7fcfe] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Most searched next step</p>
                    <p className="mt-3 text-lg text-[#0e2b43]">Search a denial like yours and compare the exact excuse.</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#d7e7eb] bg-[#f7fcfe] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Then do this</p>
                    <p className="mt-3 text-lg text-[#0e2b43]">Use the matching pattern to write a sharper appeal, not a generic complaint.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Why now</p>
            <h2 className="mt-3 text-3xl tracking-[-0.05em] text-[#0e2b43] md:text-4xl">
              Why this moment matters if you are trying to fight a denial.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5b7789]">
              This works best when it feels like journalism and evidence, not marketing. The system is failing patients, regulators are moving, and people still need precedent they can use today.
            </p>
            <Button
              variant="outline"
              onClick={() => onNavigate('insights')}
              className="mt-6 rounded-full border-[#d7e7eb] bg-white text-[#12324a] hover:bg-[#f4fbfd]"
            >
              Open evidence patterns
            </Button>
          </div>

          <div className="space-y-4">
            {HOMEPAGE_NEWS.map((item, index) => (
              <article key={item.title} className="grid gap-4 rounded-[1.8rem] border border-[#d7e7eb] bg-white p-5 shadow-[0_20px_60px_rgba(34,95,130,0.08)] md:grid-cols-[auto_1fr_auto] md:items-start">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7e7eb] bg-[#f4fbfd] text-sm font-semibold text-[#2e7888]">
                  0{index + 1}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">{item.narrative}</p>
                    <span className="rounded-full border border-[#d7e7eb] bg-[#f4fbfd] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4f6f80]">
                      {item.source}
                    </span>
                  </div>
                  <h3 className="text-2xl text-[#0e2b43]">{item.title}</h3>
                  <p className="text-sm leading-7 text-[#5b7789]">{item.summary}</p>
                  <blockquote className="border-l-2 border-[#2ea89a]/55 pl-4 text-sm italic leading-7 text-[#25546a]">
                    {item.pullQuote}
                  </blockquote>
                </div>
                <div className="rounded-[1.3rem] border border-[#d7e7eb] bg-[#f7fcfe] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2e7888]">What this means</p>
                  <p className="mt-3 text-sm leading-7 text-[#557082]">{item.whatThisMeans}</p>
                  <p className="mt-4 text-lg font-semibold text-[#0e2b43]">{item.stat}</p>
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
                    className="mt-4 inline-flex items-center text-sm font-semibold text-[#0f5ea8]"
                  >
                    Read source <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8">
        <div className="rounded-[2.4rem] border border-[#d7e7eb] bg-white p-8 shadow-[0_20px_60px_rgba(34,95,130,0.08)] md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Patient stories of resilience</p>
              <h2 className="mt-3 text-3xl tracking-[-0.05em] text-[#0e2b43] md:text-4xl">
                Curated stories that show how people documented denials and kept pushing.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#5b7789]">
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
                className="rounded-full border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-2 text-sm font-medium text-[#27576c] transition-colors hover:bg-[#eef8fa]"
              >
                {filter}
              </button>
            ))}
          </div>

          {liveStories.length ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {liveStories.map((story) => {
              const tags = buildStoryTags(story);
              const title = (story as any).title || buildStoryTitle(story);
              const summary = story.preview || buildStoryPreview(story);
              const actionTag = (story as any).actionTag || buildStoryActionTag(story);
              const whatWasDenied = story.whatWasDenied || buildWhatWasDenied(story);
              return (
                <article key={story.id} className="flex h-full flex-col rounded-[1.9rem] border border-[#d7e7eb] bg-[#f9fdff] p-6">
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
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#0e2b43]">{title}</h3>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">
                    What was denied: {whatWasDenied}
                  </p>
                  <p className="mt-4 min-h-[112px] text-sm leading-7 text-[#557082]">{summary}</p>
                  {story.sourceConfidenceLabel ? (
                    <p className="mt-4 text-xs leading-6 text-[#9da7d1]">
                      {story.sourceConfidenceLabel}: {story.sourceTrustNote}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        onSearchTermChange(`${story.insurer || story.extracted_insurer || ''} ${story.procedure || story.procedure_condition || ''}`.trim());
                        onOpenRecordFromQuery();
                      }}
                        className="text-sm font-semibold text-[#0f5ea8]"
                    >
                      Read story
                    </button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onSearchTermChange(`${story.insurer || story.extracted_insurer || ''} ${story.procedure || story.procedure_condition || ''}`.trim());
                        onOpenRecordFromQuery();
                      }}
                      className="rounded-full border-[#d7e7eb] bg-white text-[#12324a] hover:bg-[#f4fbfd]"
                    >
                      This matches my situation
                    </Button>
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
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#0e2b43] md:text-3xl">
                    We do not show fabricated patient stories here.
                  </h3>
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
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#2e7888]">Fight back</p>
              <h2 className="text-4xl tracking-[-0.05em] text-[#0e2b43] md:text-5xl">
                Don't fight your denial alone. Build a data-backed appeal in minutes.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-[#5b7789]">
                Our AI uses patterns from thousands of real denials to help you write a stronger, more targeted appeal - grounded in evidence, not guesswork.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate('appeal')}
                  className="h-14 rounded-[1rem] bg-[#0f5ea8] px-8 text-base font-semibold text-white hover:bg-[#0c4f8f]"
                >
                  Write your AI appeal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate('share')}
                  className="h-14 rounded-[1rem] border-[#d7e7eb] bg-white px-8 text-base font-semibold text-[#12324a] hover:bg-[#f4fbfd]"
                >
                  Share your story
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_16px_44px_rgba(34,95,130,0.08)]">
                <div className="flex items-center gap-3 text-[#12324a]">
                  <Wand2 className="h-5 w-5 text-[#2ea89a]" />
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]">AI appeal preview</p>
                </div>
                <div className="mt-5 grid gap-3">
                  {['Search your match', "Compare the insurer's language", 'Generate a stronger appeal'].map((step, index) => (
                    <div key={step} className="flex items-start gap-4 rounded-[1.2rem] border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff4ef] text-sm font-semibold text-[#167b6d]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-base font-semibold text-[#0e2b43]">{step}</p>
                        <p className="mt-1 text-sm leading-6 text-[#5b7789]">
                          Move from "why did they do this?" to a draft that answers the insurer's actual reasoning.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-[#cfe3e9] bg-[linear-gradient(135deg,#f7fcfe,#edf8fb)] p-6 text-[#12324a]">
                <p className="text-lg font-semibold">Used by {totalStories.toLocaleString() || '1,000+'} patients in the public record</p>
                <p className="mt-2 text-sm leading-7 text-[#5b7789]">
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
