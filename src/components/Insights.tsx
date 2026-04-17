import React from 'react';
import { ArrowRight, BarChart3, MapPinned, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildActionQuestions, type HeatmapRow, type MetricRow, type PatternsResponse } from '@/src/lib/insightsPresentation';
import type { DenialRecord } from '@/src/types';
import { buildStoryActionTag, buildStoryPreview, buildStoryTags, buildStoryTitle, buildWhatWasDenied } from '@/src/lib/storyPresentation';
import { buildWarehouseDashboardSnapshot, type WarehouseDashboardSnapshot } from '@/src/lib/warehouseInsightsSnapshot';

const BAR_COLORS = ['#0f5ea8', '#2a7cc7', '#2ea89a', '#69c2bb', '#8fbfcf', '#d2e4eb'];

function prettifyLabel(label: string) {
  return label.length > 28 ? `${label.slice(0, 28)}...` : label;
}

function cleanStoryBody(story: DenialRecord) {
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

function buildHeatmapExplain(item: HeatmapRow) {
  const category = item.category.toLowerCase();
  if (category.includes('prior')) return 'This is usually a paperwork gate. Bring plan criteria, failed-treatment history, and doctor notes early.';
  if (category.includes('out of network')) return 'This often turns into a continuity-of-care or network adequacy fight, not a routine resubmission.';
  if (category.includes('medical necessity')) return 'This is where stronger chart notes, guidelines, and specialist letters usually matter most.';
  if (category.includes('coverage exclusion')) return 'This usually means the policy language itself becomes part of the appeal, not just the clinical need.';
  return 'This is a repeat denial pattern worth comparing your own letter against before you appeal.';
}

function MetricChart({ title, subtitle, rows }: { title: string; subtitle: string; rows: MetricRow[] }) {
  return (
    <div className="rounded-[1.8rem] border border-[#d6e7ed] bg-white p-5 shadow-[0_18px_40px_rgba(34,95,130,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#2e7888]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5b7789]">{subtitle}</p>
      <div className="mt-5 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 6, right: 6 }}>
            <CartesianGrid stroke="rgba(74,122,145,0.14)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={120} tick={{ fill: '#6b8797', fontSize: 12 }} tickFormatter={prettifyLabel} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d5e6ec', borderRadius: 18, color: '#12324a' }} />
            <Bar dataKey="value" radius={[999, 999, 999, 999]}>
              {rows.map((_, index) => <Cell key={`${title}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Insights() {
  const [data, setData] = React.useState<PatternsResponse | null>(null);
  const [dashboardSnapshot, setDashboardSnapshot] = React.useState<WarehouseDashboardSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [storyQuery, setStoryQuery] = React.useState('');
  const [stories, setStories] = React.useState<DenialRecord[]>([]);
  const [storyLoading, setStoryLoading] = React.useState(false);
  const [expandedStoryId, setExpandedStoryId] = React.useState<string | null>(null);

  const load = React.useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'initial') setLoading(true);
    setError(null);
    try {
      const [patternsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/insights/patterns', { cache: 'no-store' }),
        fetch('/api/insights/dashboard', { cache: 'no-store' }),
      ]);
      const patternsPayload = await patternsResponse.json();
      if (!patternsResponse.ok || patternsPayload.status !== 'success') throw new Error(patternsPayload.error || 'Failed to load evidence patterns');
      setData(patternsPayload);
      const dashboardPayload = await dashboardResponse.json();
      setDashboardSnapshot(
        dashboardResponse.ok && dashboardPayload?.snapshot
          ? dashboardPayload.snapshot
          : buildWarehouseDashboardSnapshot(patternsPayload)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence patterns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadStories = React.useCallback(async (query: string) => {
    setStoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      params.set('limit', '12');
      const response = await fetch(`/api/observatory/stories?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok && payload.status === 'success') setStories(payload.stories || []);
    } finally {
      setStoryLoading(false);
    }
  }, []);

  React.useEffect(() => { load('initial'); }, [load]);
  React.useEffect(() => { loadStories(storyQuery); }, [loadStories, storyQuery]);

  const liveSnapshot = dashboardSnapshot || (data ? buildWarehouseDashboardSnapshot(data) : null);
  const topInsurer = data?.topInsurers[0]?.label || 'Blue Cross Blue Shield';
  const topCategory = data?.topCategories[0]?.label || 'Prior Authorization';
  const topProcedure = data?.topProcedures[0]?.label || 'Prescription medication';
  const actionQuestions = buildActionQuestions(data).slice(0, 2);
  const signalRows = [
    { label: topInsurer, value: `${data?.topInsurers[0]?.value || 0}`, width: '88%' },
    { label: topCategory, value: `${data?.topCategories[0]?.value || 0}`, width: '96%' },
    { label: topProcedure, value: `${data?.topProcedures[0]?.value || 0}`, width: '74%' },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fcfd_0%,#eef8fb_100%)] px-5 py-10 text-[#12324a] md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2.8rem] border border-[#d7e7eb] bg-[radial-gradient(circle_at_top_left,rgba(85,188,204,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(103,204,156,0.16),transparent_24%),linear-gradient(135deg,#fbfeff_0%,#f0fbfc_55%,#edf8fb_100%)] p-8 shadow-[0_28px_90px_rgba(34,95,130,0.12)] md:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#d7e7eb] bg-white/88 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#2e7888]">Evidence patterns patients can use</div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl tracking-[-0.05em] text-[#0e2b43] md:text-6xl">Find the pattern that makes your denial easier to fight.</h1>
                <p className="max-w-2xl text-base leading-7 text-[#5b7789] md:text-lg">
                  {topInsurer} is surfacing more than any other named insurer right now. Here is how these denials keep repeating, what excuses keep getting used, and where patients are finding leverage.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => load('refresh')} className="rounded-full bg-[#0f5ea8] px-5 text-white hover:bg-[#0c4f8f]" disabled={refreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh the evidence
                </Button>
                <Button variant="outline" className="rounded-full border-[#d7e7eb] bg-white text-[#12324a] hover:bg-[#f4fbfd]" onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'share' }))}>
                  Add your story
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[`My insurer is ${topInsurer}`, `They used ${topCategory}`, `They denied my ${topProcedure.toLowerCase()}`].map((item) => (
                  <button key={item} type="button" onClick={() => setStoryQuery(item)} className="rounded-[1.4rem] border border-[#d7e7eb] bg-white px-5 py-4 text-left text-sm font-semibold text-[#12324a] transition-colors hover:bg-[#f4fbfd]">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-[2.2rem] border border-[#d7e7eb] bg-[linear-gradient(180deg,#ffffff_0%,#f3fbfc_100%)] p-6 shadow-[0_18px_44px_rgba(34,95,130,0.08)]">
              {liveSnapshot ? (
                <>
                  <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_16px_45px_rgba(34,95,130,0.08)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#2e7888]">Warehouse snapshot</p>
                    <p className="mt-3 text-5xl text-[#0e2b43]">{liveSnapshot.meta.usableRows}</p>
                    <p className="mt-2 text-sm leading-7 text-[#5b7789]">{liveSnapshot.meta.updatedLabel}</p>
                  </div>
                  <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-[#f7fcfe] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2e7888]">What is dominating the record</p>
                    <div className="mt-4 space-y-4">
                      {signalRows.map((row) => (
                        <div key={row.label}>
                          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4a6a7d]">
                            <span>{row.label}</span><span>{row.value}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-[#d8ebf0]">
                            <div className="h-2 rounded-full bg-[linear-gradient(90deg,#2a7cc7,#2ea89a)]" style={{ width: row.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {error ? <div className="rounded-[1.8rem] border border-[#f4d0cc] bg-[#fff3f1] p-6 text-[#8b4036]">{error}</div> : null}
        {loading && !data ? <div className="rounded-[2rem] border border-[#d7e7eb] bg-white p-10 text-center text-[#5b7789]">Loading the current evidence patterns...</div> : null}

        {data ? (
          <>
            <section className="rounded-[2.3rem] border border-[#d7e7eb] bg-[linear-gradient(180deg,#ffffff_0%,#f2fbfc_100%)] p-8 shadow-[0_20px_60px_rgba(34,95,130,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-4xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#2e7888]">What the broader record is showing</p>
                  <h2 className="mt-3 text-3xl tracking-[-0.05em] text-[#0e2b43] md:text-4xl">The signal board: fewer widgets, stronger patterns.</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5b7789]">We only surface the repeat fights that are large enough to matter and specific enough to use in a real appeal.</p>
                </div>
                <div className="rounded-[1.4rem] border border-[#d7e7eb] bg-[#f7fcfe] px-5 py-4 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2e7888]">{liveSnapshot?.meta.updatedLabel || 'Loading snapshot'}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#0e2b43]">{liveSnapshot?.meta.usableRows || '0'}</p>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#d7e7eb] bg-white">
                {(liveSnapshot?.cards || []).map((card, index) => (
                  <div key={card.title} className={`grid gap-4 px-6 py-6 md:grid-cols-[0.26fr_0.56fr_0.18fr] md:items-center ${index < (liveSnapshot?.cards.length || 0) - 1 ? 'border-b border-[#e2eef2]' : ''}`}>
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2e7888]">{card.eyebrow}</p><p className="mt-2 text-sm leading-7 text-[#5b7789]">{card.countLabel}</p></div>
                    <div><h3 className="text-2xl text-[#0e2b43]">{card.title}</h3><p className="mt-3 text-sm leading-7 text-[#5b7789]">{card.body}</p></div>
                    <div className="md:text-right"><p className="text-4xl text-[#0f5ea8]">{card.countValue}</p></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_40px_rgba(34,95,130,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#2e7888]">Start here</p>
                <h2 className="mt-3 text-3xl text-[#0e2b43]">Use a patient question, not a raw metric.</h2>
                <p className="mt-4 text-sm leading-7 text-[#5b7789]">Start with the question that sounds closest to your situation, then move into the matching evidence.</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {[...actionQuestions, ...(liveSnapshot?.questions || [])].slice(0, 5).map((item: any) => (
                  <div key={item.title || item.question} className="rounded-[2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_40px_rgba(34,95,130,0.08)]">
                    <h3 className="text-xl tracking-tight text-[#0e2b43]">{item.title || item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#5b7789]">{item.body || item.answer}</p>
                    {'evidence' in item ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2e7888]">{item.evidence}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <MetricChart title="Which insurers keep surfacing" subtitle="If your insurer is here, enough people are naming it clearly for the pattern to be worth watching." rows={data.topInsurers} />
              <MetricChart title="What excuse keeps getting used" subtitle="These are the reasons patients keep hearing when a denial story is specific enough to compare." rows={data.topCategories} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <MetricChart title="What care keeps getting blocked" subtitle="These are the drugs, services, and procedures that keep resurfacing in denial stories patients are trying to fight." rows={data.topProcedures} />
              <div className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_20px_60px_rgba(34,95,130,0.08)]">
                <h3 className="flex items-center gap-3 text-2xl tracking-tight text-[#0e2b43]"><MapPinned className="h-5 w-5 text-[#2e7888]" />Where complaints keep surfacing</h3>
                <div className="mt-6 space-y-4">
                  {data.statePatterns.slice(0, 6).map((state) => (
                    <div key={state.label} className="flex items-center justify-between rounded-[1.3rem] border border-[#e1eef2] bg-[#f9fdff] px-4 py-3">
                      <span className="text-sm font-medium text-[#12324a]">{state.label}</span>
                      <span className="text-sm text-[#5b7789]">{state.value.toLocaleString()} stories</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_20px_60px_rgba(34,95,130,0.08)]">
                <h3 className="flex items-center gap-3 text-2xl tracking-tight text-[#0e2b43]"><BarChart3 className="h-5 w-5 text-[#2e7888]" />If your insurer keeps leaning on one excuse</h3>
                <div className="mt-6 space-y-4">
                  {data.heatmap.slice(0, 6).map((item) => (
                    <div key={`${item.insurer}-${item.category}`} className="rounded-[1.6rem] border border-[#e1eef2] bg-[#f9fdff] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2e7888]">{item.insurer}</p><h3 className="mt-2 text-2xl tracking-[-0.05em] text-[#0e2b43]">{item.category}</h3></div>
                        <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b8797]">Stories</p><p className="mt-2 text-4xl text-[#0f5ea8]">{item.value}</p></div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#5b7789]">{buildHeatmapExplain(item)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_20px_60px_rgba(34,95,130,0.08)]">
                <h3 className="text-2xl tracking-tight text-[#0e2b43]">Search the story database</h3>
                <div className="mt-6 flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f91a0]" />
                    <input value={storyQuery} onChange={(event) => setStoryQuery(event.target.value)} placeholder="Try: UnitedHealthcare Taltz, prior authorization, MRI..." className="h-14 w-full rounded-[1.2rem] border border-[#d7e7eb] bg-[#f8fdff] pl-12 pr-4 text-base text-[#12324a] outline-none transition focus:border-[#55bccc]" />
                  </div>
                  <Button onClick={() => loadStories(storyQuery)} className="h-14 rounded-[1.2rem] bg-[#0f5ea8] px-6 text-base font-semibold text-white hover:bg-[#0c4f8f]">Search stories</Button>
                </div>
                <div className="mt-6 grid gap-4">
                  {storyLoading ? <p className="text-sm text-[#5b7789]">Refreshing stories...</p> : null}
                  {stories.slice(0, 4).map((story) => {
                    const expanded = expandedStoryId === story.id;
                    const tags = buildStoryTags(story).slice(0, 2);
                    return (
                      <article key={story.id} className="rounded-[1.6rem] border border-[#d7e7eb] bg-[#f9fdff] p-5">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => <span key={`${story.id}-${tag}`} className="rounded-full border border-[#d7e7eb] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4e7285]">{tag}</span>)}
                          <span className="rounded-full bg-[#e7f7f3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#167b6d]">{buildStoryActionTag(story)}</span>
                        </div>
                        <h4 className="mt-4 text-xl text-[#0e2b43]">{buildStoryTitle(story)}</h4>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">What was denied: {story.whatWasDenied || buildWhatWasDenied(story)}</p>
                        <p className="mt-3 text-sm leading-7 text-[#557082]">{expanded ? cleanStoryBody(story) : story.preview || buildStoryPreview(story)}</p>
                        <button type="button" onClick={() => setExpandedStoryId(expanded ? null : story.id)} className="mt-4 text-sm font-semibold text-[#0f5ea8]">
                          {expanded ? 'Show less' : 'Expand story'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-[2.3rem] border border-[#d7e7eb] bg-[linear-gradient(180deg,#ffffff_0%,#f1fbfc_100%)] p-8 shadow-[0_20px_60px_rgba(34,95,130,0.08)]">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#2e7888]">What this is for</p>
                  <h2 className="mt-3 text-3xl tracking-[-0.05em] text-[#0e2b43]">If your denial reason appears here, you are not alone - and you now have precedent.</h2>
                  <p className="mt-4 text-sm leading-7 text-[#5b7789]">Use the insurer, treatment, and denial reason that matches your case. Then bring that combination into Fight Back and build an appeal around the patterns already in the record.</p>
                </div>
                <div className="flex flex-wrap gap-4 lg:justify-end">
                  <Button onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'appeal' }))} className="rounded-full bg-[#0f5ea8] px-6 text-white hover:bg-[#0c4f8f]">See if your denial matches 1,135 others</Button>
                  <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'about' }))} className="rounded-full border-[#d7e7eb] bg-white text-[#12324a] hover:bg-[#f4fbfd]">
                    View methodology & trust details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
