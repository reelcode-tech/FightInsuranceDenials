import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BarChart3, MapPinned, RefreshCw, ShieldCheck } from 'lucide-react';
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
  buildSummaryCards,
  type HeatmapRow,
  type MetricRow,
  type PatternsResponse,
} from '@/src/lib/insightsPresentation';

const BAR_COLORS = ['#c74b3c', '#ea7a5f', '#f0ae93', '#84a59d', '#5b7286', '#334155'];

function prettifyLabel(label: string) {
  return label.length > 28 ? `${label.slice(0, 28)}…` : label;
}

function toneClasses(tone: PatternsResponse['findings'][number]['tone']) {
  if (tone === 'warning') return 'border-[#c74b3c]/30 bg-[#241514] text-[#ffd9d1]';
  if (tone === 'high') return 'border-[#c74b3c]/25 bg-[#181313] text-[#f7f2eb]';
  return 'border-white/10 bg-[#12161b] text-[#edf1f5]';
}

function HeatCell({ item, max }: { item: HeatmapRow; max: number }) {
  const intensity = max ? item.value / max : 0;
  const alpha = 0.2 + intensity * 0.65;
  return (
    <div
      className="rounded-[1.5rem] border border-white/10 p-5 transition-transform duration-200 hover:-translate-y-1"
      style={{ backgroundColor: `rgba(199, 75, 60, ${alpha})` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">{item.insurer}</p>
      <h4 className="mt-3 text-lg font-semibold leading-tight text-white">{item.category}</h4>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white">{item.value}</p>
    </div>
  );
}

function MetricChart({ title, rows }: { title: string; rows: MetricRow[] }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9e9489]">{title}</p>
      <div className="h-[255px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 6 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
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

  const heatMax = Math.max(...(data?.heatmap.map((item) => item.value) || [1]));
  const summaryCards = buildSummaryCards(data);
  const keyQuestions = buildActionQuestions(data);
  const sourceStory = buildSourceStory(data);
  const methodology = buildMethodologySummary(data);

  return (
    <div className="min-h-screen bg-[#090b0f] px-5 py-10 text-[#f3efe9] md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[2.7rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(199,75,60,0.16),transparent_28%),linear-gradient(135deg,#101317_0%,#12171d_55%,#151b22_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-8 p-8 md:p-10 lg:grid-cols-[1.45fr_0.95fr] lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#c74b3c]/25 bg-white/6 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#f19a86]">
                Evidence patterns patients can use
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#f7f2eb] md:text-6xl">
                  See where denial pressure is repeating — and what that tells you to do next.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#c8bdb4] md:text-lg">
                  This page is built for the questions people actually ask after a denial: has anyone else dealt with this insurer, this medication, this procedure, or this excuse? We only show patterns that are already strong enough to be useful.
                </p>
                {recordQuery ? (
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-[#e5d9ce]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f19a86]">Your question</p>
                    <p className="mt-2">
                      You searched for <span className="font-semibold text-[#f7f2eb]">{recordQuery}</span>. Use the patterns below to see what is already surfacing, then add your story if your exact denial is still missing from the record.
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
                  Refresh pattern review
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
              {summaryCards.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[2rem] border border-white/8 bg-white/6 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.18)]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9e9489]">{item.label}</p>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#f7f2eb]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#c8bdb4]">{item.caption}</p>
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

            <section className="grid gap-5 lg:grid-cols-3">
              {data.findings.map((finding, index) => (
                <motion.div
                  key={finding.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card className={`h-full rounded-[2rem] border ${toneClasses(finding.tone)}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl tracking-tight">{finding.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-7">{finding.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight text-[#f7f2eb]">
                    <BarChart3 className="h-5 w-5 text-[#f19a86]" />
                    What keeps happening in published denial stories
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-3">
                  <MetricChart title="Who keeps showing up" rows={data.topInsurers} />
                  <MetricChart title="What reason keeps being used" rows={data.topCategories} />
                  <MetricChart title="What care gets blocked most" rows={data.topProcedures} />
                </CardContent>
              </Card>

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
                        State-level patterns are still building as the public record gets denser.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">
                    Which insurer-and-excuse combinations keep appearing together
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.heatmap.slice(0, 8).map((item) => (
                      <HeatCell key={`${item.insurer}-${item.category}`} item={item} max={heatMax} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">
                    Evidence patterns patients can actually use
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
                          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#9e9489]">Published cases</p>
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
                    Where this evidence comes from
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sourceStory.map((item) => (
                    <div key={item.title} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                      <p className="text-sm font-semibold text-[#f7f2eb]">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-[#c8bdb4]">{item.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-white/8 bg-[linear-gradient(135deg,#171c22_0%,#1a232b_100%)] text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight">How to use this page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-white/78">
                  <p>
                    Start by looking for your insurer, your denial reason, or your treatment area. If the same combination is already surfacing here, you are not walking into your appeal alone.
                  </p>
                  <p>
                    Then compare your own case against the strongest repeated patterns and carry that into the appeal flow, where we can help draft around the same tactics other patients already ran into.
                  </p>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f19a86]">Current source mix</p>
                    <p className="mt-3 text-sm leading-7 text-white/78">
                      Right now the published record leans most heavily on {methodology.sourceSummary}. We keep widening trusted source coverage so the signal gets broader as the database grows.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/6 text-[#f3efe9] hover:bg-white/10"
                    onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'share' }))}
                  >
                    Add your denial to the database <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
