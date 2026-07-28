import React from 'react';
import { Copy, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PatternsResponse } from '@/src/lib/insightsPresentation';
import type { DenialRecord } from '@/src/types';
import {
  buildAppealParagraph,
  buildAppealQuery,
  buildAppealSuccessSummary,
  clearVisualFilterSeed,
  persistAppealContext,
  readVisualFilterSeed,
  type AppealContext,
} from '@/src/lib/appealLeverage';
import { formatPublicStoryCount, normalizePublicStoryCount } from '@/src/lib/publicMetrics';
import { normalizeInsurerName, normalizeProcedureLabel } from '@/src/lib/normalization';
import AppealLeverageDrawer from '@/src/components/AppealLeverageDrawer';
import { trackEvent } from '@/src/lib/analytics';

type MetricRow = { label: string; value: number };
type TimelineRow = {
  label: string;
  shortLabel: string;
  value: number;
  rollingAverage: number;
  successRate: number;
};

type DashboardResponse = {
  status: 'success' | 'error';
  dashboard?: {
    methodology: string;
    windowLabel: string;
    totals: {
      publishedStories: number;
      topInsurer: string;
      topCategory: string;
      topProcedure: string;
      appealSuccessRate: number;
    };
    charts: {
      insurerShare: MetricRow[];
      stateShare: MetricRow[];
      timeline: TimelineRow[];
    };
  };
};

type SearchResponse = {
  status: 'success' | 'error';
  query?: string;
  total?: number;
  stories?: DenialRecord[];
};

type GuidedQuestion = {
  title: string;
  description: string;
  insurer?: string;
  reason?: string;
  procedure?: string;
  state?: string;
  count?: number;
};

const DONUT_COLORS = ['#0f5ea8', '#2a7cc7', '#31a68e', '#6fc8b7', '#8fd6cc'];

function shareOfTotal(value: number, total: number) {
  if (!total) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function buildGuidedQuestions(patterns: PatternsResponse | null, dashboard: DashboardResponse['dashboard'] | undefined) {
  if (!patterns || !dashboard) {
    return [
      { title: 'Am I the only one getting denied for this?', description: 'Start here to see how many other patients are dealing with the same kind of denial.' },
      { title: 'What excuse is my insurer using on everyone else?', description: 'We show the denial reason that keeps coming up in real stories.' },
      { title: 'What treatment is getting blocked most?', description: 'We show which treatments patients keep fighting for the most.' },
      { title: 'Is this happening in my state?', description: 'We show where patients are reporting the same fight.' },
      { title: 'What actually helped other patients?', description: 'We show the success rate from stories where the outcome is known.' },
      { title: 'Is this new or getting worse?', description: 'We show whether these denials are rising or settling down.' },
    ];
  }

  const topInsurer = patterns.topInsurers[0];
  const topCategory = patterns.topCategories[0];
  const topProcedure = patterns.topProcedures[0];
  const topState = dashboard.charts.stateShare[0];

  const questions: GuidedQuestion[] = [
    {
      title: 'Am I the only one getting denied for this?',
      description: topProcedure
        ? `${topProcedure.label} is one of the biggest fights in the public record right now.`
        : 'We can show you similar denials from other patients right away.',
      procedure: topProcedure?.label,
      count: topProcedure?.value,
    },
    {
      title: 'What excuse is my insurer using on everyone else?',
      description: topCategory
        ? `${topCategory.label} is the excuse showing up most often in the stories we can compare.`
        : 'We can show you the most common excuse tied to your insurer.',
      reason: topCategory?.label,
      insurer: topInsurer?.label,
      count: topCategory?.value,
    },
    {
      title: 'What treatment is getting blocked most?',
      description: topProcedure
        ? `${topProcedure.label} is showing up more than any other treatment fight right now.`
        : 'We can show you which treatments patients keep fighting for.',
      procedure: topProcedure?.label,
      count: topProcedure?.value,
    },
    {
      title: 'Is this happening in my state?',
      description: topState
        ? `${topState.label} is one of the states with the most public stories in this view.`
        : 'We can show you which states are reporting the same fight.',
      state: topState?.label,
      count: topState?.value,
    },
    {
      title: 'What actually helped other patients?',
      description: `Right now, ${dashboard.totals.appealSuccessRate}% of stories with a recorded outcome show a successful appeal.`,
      insurer: topInsurer?.label,
      reason: topCategory?.label,
      procedure: topProcedure?.label,
      count: dashboard.totals.appealSuccessRate,
    },
    {
      title: 'Is this new or getting worse?',
      description: 'The trend line below shows whether these denials are rising, falling, or staying steady.',
      insurer: topInsurer?.label,
      reason: topCategory?.label,
      procedure: topProcedure?.label,
    },
  ];

  return questions;
}

function AppealCopyBox({
  paragraph,
  helper,
  successRate,
  onCopy,
  onGenerate,
}: {
  paragraph: string;
  helper: string;
  successRate: number;
  onCopy: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="mt-5 rounded-[1.6rem] border border-[#d7e8ee] bg-[linear-gradient(180deg,#f8fdff_0%,#eef8fb_100%)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">Use this in your appeal (60 seconds)</p>
      <p className="mt-3 text-sm leading-7 text-[#557082]">{paragraph}</p>
      <p className="mt-3 text-sm font-semibold text-[#0f5ea8]">{helper}</p>
      <p className="mt-1 text-sm font-medium text-[#167b6d]">{buildAppealSuccessSummary(successRate)}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onCopy} className="rounded-[1rem] border-[#d5e6ec] bg-white text-[#12324a] hover:bg-[#f4fbfd]">
          <Copy className="mr-2 h-4 w-4" />
          Copy appeal paragraph
        </Button>
        <Button onClick={onGenerate} className="rounded-[1rem] bg-[#0f5ea8] text-white hover:bg-[#0c4f8f]">
          <FileText className="mr-2 h-4 w-4" />
          Generate full AI appeal letter
        </Button>
      </div>
    </div>
  );
}

function buildContext(input: {
  title: string;
  insurer?: string;
  reason?: string;
  procedure?: string;
  state?: string;
  publishedStories: number;
  evidenceCount?: number;
  successRate: number;
  scopeLabel: string;
  sourceLabel: string;
}) {
  return {
    title: input.title,
    paragraph: buildAppealParagraph({
      scopeLabel: input.scopeLabel,
      publishedStories: input.publishedStories,
      evidenceCount: input.evidenceCount,
      successRate: input.successRate,
      insurer: input.insurer,
      reason: input.reason,
      procedure: input.procedure,
      state: input.state,
    }),
    query: buildAppealQuery([input.insurer, input.reason, input.procedure, input.state]),
    insurer: input.insurer,
    reason: input.reason,
    procedure: input.procedure,
    state: input.state,
    publishedStories: input.publishedStories,
    evidenceCount: input.evidenceCount,
    successRate: input.successRate,
    sourceLabel: input.sourceLabel,
    createdAt: new Date().toISOString(),
  } satisfies AppealContext;
}

function copyToClipboard(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return;
  navigator.clipboard.writeText(text).catch(() => undefined);
}

export default function DataVisualizations() {
  const [patterns, setPatterns] = React.useState<PatternsResponse | null>(null);
  const [dashboardPayload, setDashboardPayload] = React.useState<DashboardResponse | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedQuestion, setSelectedQuestion] = React.useState('');
  const [results, setResults] = React.useState<DenialRecord[]>([]);
  const [fallbackResults, setFallbackResults] = React.useState<DenialRecord[]>([]);
  const [searchState, setSearchState] = React.useState<'idle' | 'loading' | 'ready'>('idle');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const [patternsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/insights/patterns', { cache: 'no-store' }),
        fetch('/api/insights/dashboard', { cache: 'no-store' }),
      ]);
      const patternsJson = await patternsResponse.json();
      const dashboardJson = await dashboardResponse.json();
      setPatterns(patternsJson);
      setDashboardPayload(dashboardJson);
    };

    load().catch((error) => console.error('Failed to load Evidence & Insights', error));
  }, []);

  const dashboard = dashboardPayload?.dashboard;
  const publishedStories = normalizePublicStoryCount(dashboard?.totals.publishedStories);
  const guidedQuestions = React.useMemo(() => buildGuidedQuestions(patterns, dashboard), [patterns, dashboard]);

  React.useEffect(() => {
    if (guidedQuestions.length && !selectedQuestion) {
      const seeded = readVisualFilterSeed();
      if (seeded?.quickFilterLabel) {
        setSelectedQuestion(seeded.quickFilterLabel);
        setSearchTerm(buildAppealQuery([seeded.insurer, seeded.reason, seeded.procedure, seeded.state]));
        clearVisualFilterSeed();
        return;
      }
      setSelectedQuestion(guidedQuestions[0].title);
    }
  }, [guidedQuestions, selectedQuestion]);

  const activeQuestion = guidedQuestions.find((item) => item.title === selectedQuestion) || guidedQuestions[0] || null;
  const activeSearch = searchTerm.trim() || buildAppealQuery([
    activeQuestion?.insurer,
    activeQuestion?.reason,
    activeQuestion?.procedure,
    activeQuestion?.state,
  ]);

  const quickInsurers = patterns?.topInsurers.slice(0, 4) || [];
  const quickProcedures = patterns?.topProcedures.slice(0, 4) || [];
  const quickReasons = patterns?.topCategories.slice(0, 4) || [];

  React.useEffect(() => {
    if (!activeSearch) return;
    let cancelled = false;

    const normalizedInsurer = normalizeInsurerName(activeSearch);
    const normalizedProcedure = normalizeProcedureLabel(activeSearch);
    const fallbackQuery = buildAppealQuery([
      normalizedInsurer !== 'Unknown' ? normalizedInsurer : '',
      normalizedProcedure !== 'Insurance denial evidence' ? normalizedProcedure : '',
      patterns?.topCategories[0]?.label || '',
    ]);

    const loadSearch = async () => {
      setSearchState('loading');
      const primaryResponse = await fetch(`/api/observatory/stories?q=${encodeURIComponent(activeSearch)}&limit=8`, { cache: 'no-store' });
      const primaryJson = (await primaryResponse.json()) as SearchResponse;
      if (cancelled) return;
      setResults(primaryJson.stories || []);

      if ((primaryJson.total || 0) === 0 && fallbackQuery && fallbackQuery !== activeSearch) {
        const fallbackResponse = await fetch(`/api/observatory/stories?q=${encodeURIComponent(fallbackQuery)}&limit=6`, { cache: 'no-store' });
        const fallbackJson = (await fallbackResponse.json()) as SearchResponse;
        if (cancelled) return;
        setFallbackResults(fallbackJson.stories || []);
      } else {
        setFallbackResults([]);
      }

      setSearchState('ready');
    };

    loadSearch().catch((error) => {
      if (!cancelled) {
        console.error('Failed to search stories', error);
        setResults([]);
        setFallbackResults([]);
        setSearchState('ready');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearch, patterns]);

  const insurerData = React.useMemo(() => {
    if (!dashboard?.charts.insurerShare?.length) return [];
    if (!activeQuestion?.insurer) return dashboard.charts.insurerShare.slice(0, 5);

    const selected = dashboard.charts.insurerShare.find((item) => item.label === activeQuestion.insurer);
    const total = dashboard.charts.insurerShare.reduce((sum, item) => sum + item.value, 0);
    if (!selected) return dashboard.charts.insurerShare.slice(0, 5);
    const otherValue = Math.max(total - selected.value, 0);
    return otherValue ? [selected, { label: 'Other insurers', value: otherValue }] : [selected];
  }, [dashboard, activeQuestion]);

  const reasonData = patterns?.topCategories.slice(0, 5) || [];
  const treatmentData = patterns?.topProcedures.slice(0, 5) || [];
  const timelineData = dashboard?.charts.timeline || [];

  const insurerTotal = insurerData.reduce((sum, item) => sum + item.value, 0);
  const successRate = dashboard?.totals.appealSuccessRate || 0;
  const topState = dashboard?.charts.stateShare[0];

  const insurerContext = buildContext({
    title: 'What your insurer is doing to other patients',
    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
    reason: activeQuestion?.reason || dashboard?.totals.topCategory,
    procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
    publishedStories,
    evidenceCount: insurerData[0]?.value,
    successRate,
    scopeLabel: 'insurer chart',
    sourceLabel: 'Evidence & Insights insurer chart',
  });

  const treatmentContext = buildContext({
    title: 'What treatment is getting blocked most',
    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
    reason: activeQuestion?.reason || reasonData[0]?.label,
    procedure: activeQuestion?.procedure || treatmentData[0]?.label,
    publishedStories,
    evidenceCount: treatmentData[0]?.value,
    successRate,
    scopeLabel: 'treatment chart',
    sourceLabel: 'Evidence & Insights treatment chart',
  });

  const timelineContext = buildContext({
    title: 'Is this getting worse?',
    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
    reason: activeQuestion?.reason || dashboard?.totals.topCategory,
    procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
    publishedStories,
    evidenceCount: timelineData[timelineData.length - 1]?.value,
    successRate: timelineData[timelineData.length - 1]?.successRate || successRate,
    scopeLabel: dashboard?.windowLabel || 'current timeline',
    sourceLabel: dashboard?.windowLabel || 'timeline',
  });

  const drawerContext = insurerContext;

  const openAppealBuilder = (context: AppealContext) => {
    persistAppealContext(context);
    window.dispatchEvent(new CustomEvent('nav', { detail: 'appeal' }));
  };

  const displayStories = results.length ? results : fallbackResults;
  const featuredStories = displayStories.slice(0, 3);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#edf7fb_100%)] px-4 py-8 text-[#143047] md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2.8rem] border border-[#d8e8ef] bg-[radial-gradient(circle_at_top_left,rgba(85,188,204,0.15),transparent_28%),linear-gradient(180deg,#fbfeff_0%,#f1fbfc_100%)] p-6 shadow-[0_24px_70px_rgba(21,75,112,0.1)] md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e7eb] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">
                Evidence & Insights
              </div>
              <h1 className="max-w-4xl text-4xl tracking-[-0.05em] text-[#0e2b43] md:text-6xl">
                Search Denial Patterns by State, Insurer, and Care Type
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[#557082] md:text-lg">
                Start with a simple question. We show publicly shared patient stories, state-by-state signals, and public payer records where they exist, then explain what the lookup can and cannot prove.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-[#d7e7eb] bg-white p-5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">
                Search real denials
              </label>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f91a0]" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    trackEvent('lookup_search_started', { source: 'lookup_page' });
                  }}
                  placeholder='Type your denial in plain English (e.g. "GLP-1 medication denied by UnitedHealthcare" or "MRI prior auth denied")'
                  className="h-14 w-full rounded-[1rem] border border-[#d5e6ec] bg-[#f9fdff] pl-12 pr-4 text-[15px] text-[#12324a] outline-none"
                />
              </div>
              <p className="mt-3 text-sm leading-7 text-[#557082]">
                We use real insurers, denial reasons, and treatment names from the database so the page never starts empty.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickInsurers.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchTerm(item.label)}
                  className="rounded-full border border-[#d7e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#27576c]"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {quickProcedures.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchTerm(item.label)}
                  className="rounded-full border border-[#d7e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#27576c]"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {quickReasons.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchTerm(item.label)}
                  className="rounded-full border border-[#d7e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#27576c]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[1.8rem] border border-[#d7e7eb] bg-white p-5 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">What is in this lookup</p>
            <p className="mt-3 text-sm leading-7 text-[#557082]">
              Publicly shared patient stories, curated public records, state-level signals, insurer names, denial reasons, and care categories that have been normalized for easier search.
            </p>
          </article>
          <article className="rounded-[1.8rem] border border-[#d7e7eb] bg-white p-5 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">What is not in this lookup</p>
            <p className="mt-3 text-sm leading-7 text-[#557082]">
              It is not a complete claims database, not a private employer-plan audit, and not proof that your plan denied the same thing. It helps you ask sharper questions and find similar public fights.
            </p>
          </article>
          <article className="rounded-[1.8rem] border border-[#d7e7eb] bg-white p-5 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">State-by-state view</p>
            <p className="mt-3 text-sm leading-7 text-[#557082]">
              States appear when a public story or public record includes enough location signal. Some states look quiet because the data has not been shared publicly yet, not because denials are absent.
            </p>
          </article>
        </section>

        <section className="grid gap-5 sm:gap-6 lg:grid-cols-3">
          {guidedQuestions.map((question) => (
            <button
              key={question.title}
              type="button"
              onClick={() => {
                setSelectedQuestion(question.title);
                setSearchTerm(buildAppealQuery([question.insurer, question.reason, question.procedure, question.state]));
              }}
              className={`rounded-[1.9rem] border p-6 text-left shadow-[0_18px_50px_rgba(34,95,130,0.08)] transition ${
                selectedQuestion === question.title ? 'border-[#9dd2de] bg-[#eef8fb]' : 'border-[#d7e7eb] bg-white hover:-translate-y-0.5'
              }`}
            >
              <h2 className="text-2xl tracking-[-0.04em] text-[#0e2b43]">{question.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#557082]">{question.description}</p>
              {question.count ? <p className="mt-4 text-sm font-semibold text-[#0f5ea8]">{formatPublicStoryCount(question.count)} related stories</p> : null}
            </button>
          ))}
        </section>

        <section className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Stories first</p>
              <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">Read the public record</h2>
              <p className="mt-3 text-sm leading-7 text-[#557082]">
                We found public stories that are closest to this fight. Start here if you want to see whether other patients are hearing the same excuse before you look at the charts.
              </p>
              {searchState === 'loading' ? <p className="mt-4 text-sm font-semibold text-[#0f5ea8]">Searching the public record...</p> : null}
            </div>
            <div className="grid gap-4">
              {featuredStories.length ? (
                featuredStories.map((story) => (
                  <article key={story.id} className="rounded-[1.4rem] border border-[#e2eef2] bg-[#f9fdff] p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#d7e7eb] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4e7285]">
                        {story.insurer || 'Insurer not listed'}
                      </span>
                      <span className="rounded-full border border-[#d7e7eb] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4e7285]">
                        {story.procedure || 'Care denied'}
                      </span>
                      <span className="rounded-full bg-[#e7f7f3] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#167b6d]">
                        {story.denialReason || 'Coverage denial'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[#0e2b43]">{story.title || `${story.procedure} denied by ${story.insurer}`}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#557082]">{story.preview || story.summary || story.narrative}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-[#e2eef2] bg-[#f9fdff] p-4 text-sm leading-7 text-[#557082]">
                  We do not have a strong public match yet. Try your insurer name, treatment, or the denial reason.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Question</p>
                <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">How often is this insurer showing up?</h2>
              </div>
              <p className="rounded-full border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-2 text-sm font-semibold text-[#2e7888]">
                {formatPublicStoryCount(publishedStories)} public stories
              </p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={260}>
                  <PieChart>
                    <Pie data={insurerData} dataKey="value" nameKey="label" innerRadius={64} outerRadius={96} paddingAngle={3}>
                      {insurerData.map((row, index) => (
                        <Cell key={row.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${shareOfTotal(value, insurerTotal)} of all stories`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {insurerData.map((item, index) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-[#e2eef2] bg-[#f9fdff] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                        <span className="text-sm font-semibold text-[#12324a]">{item.label}</span>
                      </div>
                      <span className="text-sm text-[#557082]">{shareOfTotal(item.value, insurerTotal)}</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#6b8797]">{item.value.toLocaleString()} stories</p>
                  </div>
                ))}
              </div>
            </div>
            <AppealCopyBox
              paragraph={insurerContext.paragraph}
              helper={`${insurerContext.insurer || 'This insurer'} appears in ${shareOfTotal(insurerData[0]?.value || 0, insurerTotal)} of the stories in this view.`}
              successRate={successRate}
              onCopy={() => copyToClipboard(insurerContext.paragraph)}
              onGenerate={() => openAppealBuilder(insurerContext)}
            />
          </article>

          <article className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Question</p>
                <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">What excuse keeps showing up?</h2>
              </div>
            </div>
            <div className="mt-6 h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={280}>
                <BarChart data={reasonData}>
                  <XAxis dataKey="label" tick={{ fill: '#6b8797', fontSize: 11 }} angle={-12} textAnchor="end" height={70} interval={0} />
                  <YAxis tick={{ fill: '#6b8797', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {reasonData.map((row, index) => (
                      <Cell key={row.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <AppealCopyBox
              paragraph={buildAppealParagraph({
                scopeLabel: 'denial reason chart',
                publishedStories,
                evidenceCount: reasonData[0]?.value,
                successRate,
                insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
                reason: reasonData[0]?.label,
                procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
              })}
              helper={`${reasonData[0]?.label || 'This excuse'} is the reason showing up most often right now.`}
              successRate={successRate}
              onCopy={() =>
                copyToClipboard(
                  buildAppealParagraph({
                    scopeLabel: 'denial reason chart',
                    publishedStories,
                    evidenceCount: reasonData[0]?.value,
                    successRate,
                    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
                    reason: reasonData[0]?.label,
                    procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
                  }),
                )
              }
              onGenerate={() =>
                openAppealBuilder(
                  buildContext({
                    title: 'What excuse insurers keep using',
                    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
                    reason: reasonData[0]?.label,
                    procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
                    publishedStories,
                    evidenceCount: reasonData[0]?.value,
                    successRate,
                    scopeLabel: 'denial reason chart',
                    sourceLabel: 'Evidence & Insights denial reason chart',
                  }),
                )
              }
            />
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Question</p>
              <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">What care gets blocked most?</h2>
            </div>
            <div className="mt-6 h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={280}>
                <BarChart data={treatmentData}>
                  <XAxis dataKey="label" tick={{ fill: '#6b8797', fontSize: 11 }} angle={-12} textAnchor="end" height={70} interval={0} />
                  <YAxis tick={{ fill: '#6b8797', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {treatmentData.map((row, index) => (
                      <Cell key={row.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <AppealCopyBox
              paragraph={treatmentContext.paragraph}
              helper={`${treatmentData[0]?.label || 'This treatment'} is the treatment fight showing up most often in the public record right now.`}
              successRate={successRate}
              onCopy={() => copyToClipboard(treatmentContext.paragraph)}
              onGenerate={() => openAppealBuilder(treatmentContext)}
            />
          </article>

          <article className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Question</p>
              <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">Where is this happening?</h2>
              <p className="mt-3 text-sm leading-7 text-[#557082]">
                This state-by-state view shows where the current public record has signal. It will undercount places where patients, regulators, or payers have not published usable records yet.
              </p>
            </div>
            <div className="mt-6 grid gap-3">
              {(dashboard?.charts.stateShare || []).slice(0, 6).map((state) => (
                <button
                  key={state.label}
                  type="button"
                  onClick={() => trackEvent('lookup_state_filter_click', { state: state.label, source: 'lookup_page' })}
                  className="rounded-[1.2rem] border border-[#e2eef2] bg-[#f9fdff] px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#12324a]">{state.label}</span>
                    <span className="text-sm text-[#557082]">{state.value.toLocaleString()} stories</span>
                  </div>
                </button>
              ))}
            </div>
            <AppealCopyBox
              paragraph={buildAppealParagraph({
                scopeLabel: 'state list',
                publishedStories,
                evidenceCount: topState?.value,
                successRate,
                insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
                reason: activeQuestion?.reason || dashboard?.totals.topCategory,
                procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
                state: topState?.label,
              })}
              helper={topState ? `${topState.label} has ${topState.value.toLocaleString()} public stories in the current view.` : 'We show the states with the most public stories first.'}
              successRate={successRate}
              onCopy={() =>
                copyToClipboard(
                  buildAppealParagraph({
                    scopeLabel: 'state list',
                    publishedStories,
                    evidenceCount: topState?.value,
                    successRate,
                    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
                    reason: activeQuestion?.reason || dashboard?.totals.topCategory,
                    procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
                    state: topState?.label,
                  }),
                )
              }
              onGenerate={() =>
                openAppealBuilder(
                  buildContext({
                    title: 'What patients in my state are seeing',
                    insurer: activeQuestion?.insurer || dashboard?.totals.topInsurer,
                    reason: activeQuestion?.reason || dashboard?.totals.topCategory,
                    procedure: activeQuestion?.procedure || dashboard?.totals.topProcedure,
                    state: topState?.label,
                    publishedStories,
                    evidenceCount: topState?.value,
                    successRate,
                    scopeLabel: 'state list',
                    sourceLabel: 'Evidence & Insights state list',
                  }),
                )
              }
            />
          </article>
        </section>

        <section className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Question</p>
            <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">Is this new or getting worse?</h2>
          </div>
          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={300}>
              <LineChart data={timelineData}>
                <XAxis dataKey="shortLabel" tick={{ fill: '#6b8797', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: '#6b8797', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#6b8797', fontSize: 12 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="value" stroke="#0f5ea8" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#31a68e" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <AppealCopyBox
            paragraph={timelineContext.paragraph}
            helper={`${dashboard?.windowLabel || 'This timeline'} shows whether this denial fight is rising or settling down.`}
            successRate={timelineContext.successRate}
            onCopy={() => copyToClipboard(timelineContext.paragraph)}
            onGenerate={() => openAppealBuilder(timelineContext)}
          />
        </section>

        <section className="rounded-[2.2rem] border border-[#d7e7eb] bg-white p-6 shadow-[0_18px_50px_rgba(34,95,130,0.08)]">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">More stories like yours</p>
              <h2 className="mt-2 text-3xl tracking-[-0.04em] text-[#0e2b43]">Keep digging into similar fights</h2>
              <p className="mt-3 text-sm leading-7 text-[#557082]">
                This is where you read the real public stories behind the charts. If we do not have your exact denial yet, we show the closest similar fights instead.
              </p>
              {searchState === 'loading' ? <p className="mt-4 text-sm font-semibold text-[#0f5ea8]">Searching the public record...</p> : null}
              {searchState === 'ready' && !results.length && fallbackResults.length ? (
                <p className="mt-4 rounded-[1rem] border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-3 text-sm leading-7 text-[#557082]">
                  We don&apos;t have your exact denial yet, but here&apos;s what&apos;s happening to patients with very similar fights.
                </p>
              ) : null}
              {searchState === 'ready' && !results.length && !fallbackResults.length ? (
                <p className="mt-4 rounded-[1rem] border border-[#d7e7eb] bg-[#f7fcfe] px-4 py-3 text-sm leading-7 text-[#557082]">
                  We don&apos;t have a good public match for that search yet. Try your insurer name, the treatment, or the denial reason instead.
                </p>
              ) : null}
            </div>
            <div className="grid gap-4">
              {displayStories.slice(0, 6).map((story) => (
                <article key={story.id} className="rounded-[1.4rem] border border-[#e2eef2] bg-[#f9fdff] p-4">
                  <h3 className="text-lg font-semibold text-[#0e2b43]">{story.title || `${story.procedure} denied by ${story.insurer}`}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#557082]">{story.preview || story.summary || story.narrative}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-3 rounded-full bg-[#0f5ea8] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,94,168,0.28)] transition hover:bg-[#0c4f8f]"
      >
        <FileText className="h-4 w-4" />
        Build My Appeal
      </button>

      <AppealLeverageDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        context={drawerContext}
        stories={displayStories}
        onGenerateAppeal={() => openAppealBuilder(drawerContext)}
      />
    </div>
  );
}
