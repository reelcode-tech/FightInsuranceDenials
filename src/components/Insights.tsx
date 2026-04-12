import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, MapPinned, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildActionQuestions,
  buildMethodologySummary,
  buildSourceStory,
  type HeatmapRow,
  type MetricRow,
  type PatternsResponse,
} from '@/src/lib/insightsPresentation';

const BAR_COLORS = ['#c74b3c', '#eb7857', '#f1ac8f', '#8aa4b5', '#5b7286', '#344151'];

function prettifyLabel(label: string) {
  return label.length > 28 ? `${label.slice(0, 28)}...` : label;
}

function MetricChart({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: MetricRow[];
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/8 bg-[#11161b] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f1a28e]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#c8bdb4]">{subtitle}</p>
      <div className="mt-5 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 6, right: 6 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fill: '#c8bdb4', fontSize: 12 }}
              tickFormatter={prettifyLabel}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: '#0f1318',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '18px',
                color: '#f7f2eb',
              }}
            />
            <Bar dataKey="value" radius={[999, 999, 999, 999]}>
              {rows.map((_, index) => (
                <Cell key={`${title}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function buildHeatmapExplain(item: HeatmapRow) {
  const category = item.category.toLowerCase();
  if (category.includes('prior')) {
    return 'This usually means the plan is forcing extra approvals before care can move. Gather doctor notes, failed-treatment history, and the plan rule they are leaning on.';
  }
  if (category.includes('out of network')) {
    return 'This is often a continuity-of-care or network adequacy fight. If treatment was already in motion, that matters.';
  }
  if (category.includes('medical necessity')) {
    return 'This is where strong clinical notes, guidelines, and specialist letters tend to matter most.';
  }
  if (category.includes('coverage exclusion')) {
    return 'This is often less about medicine and more about plan language. The policy itself becomes part of the argument.';
  }
  return 'This is a repeat denial pattern worth comparing your own letter against before you appeal.';
}

export default function Insights() {
  const [data, setData] = React.useState<PatternsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recordQuery, setRecordQuery] = React.useState<string>('');

  const load = React.useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'initial') setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insights/patterns', { cache: 'no-store' });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const raw = await response.text();
        throw new Error(raw.slice(0, 180) || 'Pattern endpoint did not return JSON');
      }
      const payload = await response.json();
      if (!response.ok || payload.status !== 'success') {
        throw new Error(payload.error || 'Failed to load evidence patterns');
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence patterns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load('initial');
  }, [load]);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem('fid_record_query');
      if (!stored) return;
      const parsed = JSON.parse(stored) as { query?: string };
      const query = parsed?.query?.trim();
      if (!query) return;
      setRecordQuery(query);
      window.sessionStorage.removeItem('fid_record_query');
    } catch (err) {
      console.error('Failed to restore record query', err);
    }
  }, []);

  const keyQuestions = buildActionQuestions(data);
  const sourceStory = buildSourceStory(data);
  const methodology = buildMethodologySummary(data);

  return (
    <div className="min-h-screen bg-[#090b0f] px-5 py-10 text-[#f3efe9] md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2.7rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(199,75,60,0.16),transparent_28%),linear-gradient(135deg,#101317_0%,#12171d_55%,#151b22_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-8 p-8 md:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#c74b3c]/25 bg-white/6 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#f19a86]">
                Evidence patterns patients can use
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#f7f2eb] md:text-6xl">
                  Find the pattern that makes your denial easier to fight.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#c8bdb4] md:text-lg">
                  This page is for the questions people ask after a denial: who else ran into this insurer, what excuse keeps getting used, and what kind of care keeps getting blocked?
                </p>
                {recordQuery ? (
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-[#e5d9ce]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f19a86]">Your question</p>
                    <p className="mt-2">
                      We carried your question in here: <span className="font-semibold text-[#f7f2eb]">{recordQuery}</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => load('refresh')}
                  className="rounded-full bg-[#c74b3c] px-5 text-white hover:bg-[#b53e31]"
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh the evidence
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/6 text-[#f3efe9] hover:bg-white/10"
                  onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'share' }))}
                >
                  Add your story
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {data?.findings.slice(0, 3).map((finding, index) => (
                <motion.div
                  key={finding.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[2rem] border border-white/8 bg-white/6 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.18)]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f19a86]">
                    Key finding
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#f7f2eb]">{finding.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[#c8bdb4]">{finding.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <Card className="border-[#c74b3c]/30 bg-[#291716]">
            <CardContent className="p-6 text-[#ffd7cf]">{error}</CardContent>
          </Card>
        )}

        {loading && !data ? (
          <Card className="rounded-[2rem] border-white/8 bg-[#12161b]">
            <CardContent className="flex h-64 items-center justify-center text-[#c8bdb4]">
              Loading the current evidence patterns...
            </CardContent>
          </Card>
        ) : null}

        {data ? (
          <>
            <section className="grid gap-5 lg:grid-cols-4">
              {keyQuestions.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card className="h-full rounded-[2rem] border border-white/10 bg-[#12161b]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl tracking-tight text-[#f7f2eb]">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-7 text-[#c8bdb4]">{item.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <MetricChart
                title="Which insurers keep getting named"
                subtitle="Start here if you want to know whether your insurer keeps showing up in similar stories."
                rows={data.topInsurers}
              />
              <MetricChart
                title="What excuse keeps getting used"
                subtitle="These are the denial reasons that surface most often once a story is specific enough to compare."
                rows={data.topCategories}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <MetricChart
                title="What care keeps getting blocked"
                subtitle="These are the treatments and services that keep surfacing in repeat denial stories."
                rows={data.topProcedures}
              />

              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight text-[#f7f2eb]">
                    <MapPinned className="h-5 w-5 text-[#f19a86]" />
                    Where complaints keep surfacing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.statePatterns.length ? (
                      data.statePatterns.slice(0, 6).map((state) => (
                        <div key={state.label} className="flex items-center justify-between rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                          <span className="text-sm font-medium text-[#f7f2eb]">{state.label}</span>
                          <span className="text-sm text-[#c8bdb4]">{state.value.toLocaleString()} stories</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-[#c8bdb4]">
                        Geographic patterns are still building as more public stories come into the database.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight text-[#f7f2eb]">
                    <BarChart3 className="h-5 w-5 text-[#f19a86]" />
                    If your insurer keeps leaning on one excuse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.heatmap.slice(0, 6).map((item) => (
                    <div key={`${item.insurer}-${item.category}`} className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f19a86]">{item.insurer}</p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#f7f2eb]">{item.category}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9e9489]">Stories</p>
                          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#f19a86]">{item.value}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#c8bdb4]">{buildHeatmapExplain(item)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">
                    If your drug, treatment, or procedure was denied, start here
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.procedureClusters.slice(0, 5).map((cluster) => (
                    <div key={`${cluster.insurer}-${cluster.category}-${cluster.procedure}`} className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#3c1f1b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f19a86]">
                          {cluster.insurer}
                        </span>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">
                          {cluster.category}
                        </span>
                      </div>
                      <div className="mt-4 flex items-start justify-between gap-5">
                        <div>
                          <h3 className="text-3xl font-semibold tracking-[-0.05em] text-[#f7f2eb]">{cluster.procedure}</h3>
                          <p className="mt-3 text-sm leading-7 text-[#ddd1c6]">{cluster.takeaway}</p>
                          <p className="mt-3 text-sm leading-7 text-[#b8aea5]">{cluster.whyItMatters}</p>
                        </div>
                        <div className="min-w-[96px] text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#9e9489]">Stories</p>
                          <p className="mt-3 text-5xl font-semibold tracking-[-0.06em] text-[#f19a86]">{cluster.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">
                    What this database is built from
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-[#c8bdb4]">
                  {sourceStory.map((item) => (
                    <div key={item.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                      <h3 className="text-lg font-semibold text-[#f7f2eb]">{item.title}</h3>
                      <p className="mt-2">{item.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">
                    How to use this page
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-[#c8bdb4]">
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    Look up the insurer. Then look for your drug, procedure, or denial reason. The goal is to find a pattern you can compare yourself against, not just a chart to stare at.
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    {methodology.coverageSummary}
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    Built from {methodology.sourceSummary}.
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
