import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, MapPinned, RefreshCw, ShieldCheck, Target } from 'lucide-react';
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

type MetricRow = { label: string; value: number };
type HeatmapRow = { insurer: string; category: string; value: number };
type ClusterRow = { procedure: string; insurer: string; category: string; value: number; takeaway: string; whyItMatters: string };
type FindingRow = { title: string; body: string; tone: 'high' | 'medium' | 'warning' };
type PatternsResponse = {
  status: 'success' | 'error';
  overview: {
    totalRows: number;
    cleanPatternRows: number;
    unknownInsurerPct: number;
    unknownCategoryPct: number;
    genericProcedurePct: number;
  };
  findings: FindingRow[];
  topInsurers: MetricRow[];
  topCategories: MetricRow[];
  topProcedures: MetricRow[];
  heatmap: HeatmapRow[];
  procedureClusters: ClusterRow[];
  statePatterns: MetricRow[];
  sourceMix: MetricRow[];
};

const BAR_COLORS = ['#c74b3c', '#ea7a5f', '#f0ae93', '#84a59d', '#5b7286', '#334155'];

function toneClasses(tone: FindingRow['tone']) {
  if (tone === 'warning') {
    return 'border-[#c74b3c]/28 bg-[#2b1714] text-[#ffd7cf]';
  }
  if (tone === 'high') {
    return 'border-[#c74b3c]/25 bg-[#1a1413] text-[#f9e9e3]';
  }
  return 'border-white/10 bg-[#12161b] text-[#eef2f6]';
}

function prettifyLabel(label: string) {
  return label.length > 26 ? `${label.slice(0, 26)}…` : label;
}

function HeatCell({ item, max }: { item: HeatmapRow; max: number }) {
  const intensity = max ? item.value / max : 0;
  const alpha = 0.2 + intensity * 0.65;
  return (
    <div
      className="rounded-[1.6rem] border border-white/10 p-5 transition-transform duration-200 hover:-translate-y-1"
      style={{ backgroundColor: `rgba(199, 75, 60, ${alpha})` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">{item.insurer}</p>
      <h4 className="mt-3 text-lg font-semibold leading-tight text-white">{item.category}</h4>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white">{item.value}</p>
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
        throw new Error(payload.error || 'Failed to load pattern review');
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pattern review');
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
  const topCategory = data?.topCategories?.[0];
  const topProcedure = data?.topProcedures?.[0];
  const topInsurer = data?.topInsurers?.[0];
  const topSourceMix = data?.sourceMix?.slice(0, 3).map((item) => item.label.replace(/_/g, ' ')).join(', ');
  const publishedCount = data?.overview.cleanPatternRows || 0;

  return (
    <div className="min-h-screen bg-[#0a0c0f] px-5 py-10 text-[#f3efe9] md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[2.7rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(199,75,60,0.16),transparent_28%),linear-gradient(135deg,#101317_0%,#12171d_55%,#151b22_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-8 p-8 md:p-10 lg:grid-cols-[1.55fr_0.85fr] lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#c74b3c]/25 bg-white/6 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#f19a86]">
                Evidence Patterns
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#f7f2eb] md:text-6xl">
                  What patients keep running into — and which denial tactics repeat.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#c8bdb4] md:text-lg">
                  This page is for the questions people actually ask after a denial: Who keeps doing this? What kinds of care get blocked most often?
                  Is my case isolated, or part of a pattern? We only show the parts of the record that already answer those questions clearly.
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
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  label: 'Stories in the record',
                  value: publishedCount,
                  caption: 'Public denial stories specific enough to compare by insurer, care type, or repeated denial tactic.',
                  icon: ShieldCheck,
                },
                {
                  label: 'Most common fight',
                  value: topCategory?.label || 'Prior Authorization',
                  caption: topCategory ? `${topCategory.value.toLocaleString()} stories already point here.` : 'This is the strongest repeat pattern so far.',
                  icon: Target,
                },
                {
                  label: 'Most blocked care',
                  value: topProcedure?.label || 'Prescription medication',
                  caption: topProcedure ? `${topProcedure.value.toLocaleString()} public stories involve this kind of care.` : 'This is the treatment fight surfacing most often.',
                  icon: BarChart3,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[2rem] border border-white/8 bg-white/6 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9e9489]">{item.label}</p>
                    <item.icon className="h-4 w-4 text-[#f19a86]" />
                  </div>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#f7f2eb]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#c8bdb4]">{item.caption}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {data ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[2.2rem] border-white/8 bg-[#12161b] shadow-[0_18px_55px_rgba(0,0,0,0.28)]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">What this page is for</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'For patients',
                    body: 'Use this to see whether your denial looks like a one-off or a pattern that other people are already fighting.',
                  },
                  {
                    title: 'For advocates and reporters',
                    body: 'Use this to spot where a payer, treatment area, or denial reason keeps surfacing often enough to deserve scrutiny.',
                  },
                  {
                    title: 'For everyone',
                    body: 'We are not trying to show every scraped complaint on the internet. We are trying to surface the repeat denial patterns that are already useful.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] bg-white/6 p-5">
                    <p className="text-sm font-semibold text-[#f7f2eb]">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-[#c8bdb4]">{item.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2.2rem] border-white/8 bg-[linear-gradient(135deg,#171c22_0%,#1a232b_100%)] text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">Why this is different from a normal complaint board</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-white/78">
                <p>
                  We collect from public patient communities, complaint platforms, condition forums, advocacy groups, investigative reporting, and official benchmark sources like OIG, KFF, and CMS.
                </p>
                <p>
                  Then we normalize insurer names, denial reasons, and care types, and we throw out generic insurance-shopping chatter that does not help someone fight a denial.
                </p>
                <p>
                  Right now the strongest repeat signals involve {topProcedure?.label?.toLowerCase() || 'medication and procedure'} fights, with{' '}
                  {topInsurer?.label || 'major payers'} surfacing most often in the named-insurer record. The source mix still leans on {topSourceMix || 'public patient communities'},
                  which is exactly why we keep focusing on repeat patterns rather than pretending every single post is equal.
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {error && (
          <Card className="border-[#c74b3c]/30 bg-[#291716]">
            <CardContent className="p-6 text-[#ffd7cf]">{error}</CardContent>
          </Card>
        )}

        {loading && !data ? (
          <Card className="rounded-[2rem] border-white/8 bg-[#12161b]">
            <CardContent className="flex h-64 items-center justify-center text-[#c8bdb4]">
              Loading the current warehouse findings...
            </CardContent>
          </Card>
        ) : null}

        {data ? (
          <>
            <section className="grid gap-5 lg:grid-cols-4">
              {data.findings.map((finding, index) => (
                <motion.div
                  key={finding.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
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

            <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight text-[#f7f2eb]">
                    <BarChart3 className="h-5 w-5 text-[#f19a86]" />
                    What people keep getting denied
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-3">
                  {[
                    { title: 'Which insurers show up the most', rows: data.topInsurers },
                    { title: 'Which denial reasons keep repeating', rows: data.topCategories },
                    { title: 'What kinds of care get blocked most', rows: data.topProcedures },
                  ].map((block, blockIndex) => (
                    <div key={block.title} className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9e9489]">{block.title}</p>
                      </div>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={block.rows} layout="vertical" margin={{ left: 6, right: 6 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                              type="category"
                              dataKey="label"
                              width={92}
                              tick={{ fill: '#c8bdb4', fontSize: 12 }}
                              tickFormatter={prettifyLabel}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(199,75,60,0.1)' }}
                              contentStyle={{
                                backgroundColor: '#171c22',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            />
                            <Bar dataKey="value" radius={[0, 14, 14, 0]}>
                              {block.rows.map((_, index) => (
                                <Cell key={`${block.title}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight text-[#f7f2eb]">
                    <Target className="h-5 w-5 text-[#f19a86]" />
                    Where the same denial tactic keeps showing up
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {data.heatmap.map((item) => (
                    <HeatCell key={`${item.insurer}-${item.category}`} item={item} max={heatMax} />
                  ))}
                  <div className="md:col-span-2 rounded-[1.5rem] border border-white/8 bg-white/6 p-5">
                    <p className="text-sm leading-7 text-[#c8bdb4]">
                      When the same insurer and denial reason keep surfacing together, it tells you this is not just bad luck. It is a repeated tactic you can compare against, cite in an appeal, or escalate to a reporter, regulator, or lawyer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">Patterns that can actually help someone push back</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.procedureClusters.map((cluster, index) => (
                    <motion.div
                      key={`${cluster.procedure}-${cluster.insurer}-${cluster.category}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-[1.8rem] border border-white/8 bg-white/6 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#3b1d19] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-[#f19a86]">
                          {cluster.insurer}
                        </span>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-[#d2cbc2]">
                          {cluster.category}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-semibold tracking-tight text-[#f7f2eb]">{cluster.procedure}</h4>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c8bdb4]">
                            {cluster.takeaway}
                          </p>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f0c8ba]">
                            {cluster.whyItMatters}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9e9489]">Matching stories</p>
                          <p className="text-4xl font-semibold tracking-[-0.05em] text-[#f19a86]">{cluster.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl tracking-tight text-[#f7f2eb]">
                      <MapPinned className="h-5 w-5 text-[#f19a86]" />
                      Which states keep surfacing in these complaints
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.statePatterns.map((state) => (
                      <div key={state.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#f7f2eb]">{state.label}</span>
                          <span className="text-[#c8bdb4]">{state.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/8">
                          <div
                            className="h-2 rounded-full bg-[#c74b3c]"
                            style={{
                              width: `${Math.max(10, (state.value / (data.statePatterns[0]?.value || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-sm leading-6 text-[#c8bdb4]">
                      Use this to spot where patients are surfacing similar coverage fights most often, especially when you are looking for local reporters, regulators, or advocacy groups already paying attention.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                  <CardHeader>
                    <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">Where this record comes from</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.sourceMix.map((source) => (
                      <div key={source.label} className="flex items-center justify-between rounded-[1.2rem] bg-white/6 px-4 py-3">
                        <span className="text-sm font-semibold text-[#f7f2eb]">{source.label.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-[#c8bdb4]">{source.value}</span>
                      </div>
                    ))}
                    <p className="text-sm leading-6 text-[#c8bdb4]">
                      We combine public patient communities, complaint platforms, investigative reporting, and benchmark sources because no single place shows the whole denial picture on its own.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
