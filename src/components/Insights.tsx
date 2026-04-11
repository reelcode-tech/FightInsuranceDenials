import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, BarChart3, Database, MapPinned, RefreshCw, Sparkles, Target } from 'lucide-react';
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
type ClusterRow = { procedure: string; insurer: string; category: string; value: number };
type QualityRow = { metric: string; value: number };
type FindingRow = { title: string; body: string; tone: 'high' | 'medium' | 'warning' };
type PatternsResponse = {
  status: 'success' | 'error';
  overview: {
    totalRows: number;
    cleanPatternRows: number;
    unknownInsurerPct: number;
    unknownCategoryPct: number;
    genericProcedurePct: number;
    suspiciousOrStateRows: number;
  };
  findings: FindingRow[];
  topInsurers: MetricRow[];
  topCategories: MetricRow[];
  topProcedures: MetricRow[];
  heatmap: HeatmapRow[];
  procedureClusters: ClusterRow[];
  statePatterns: MetricRow[];
  sourceMix: MetricRow[];
  dataQuality: QualityRow[];
};

const BAR_COLORS = ['#c74b3c', '#ea7a5f', '#f0ae93', '#84a59d', '#5b7286', '#334155'];

const metricLabels: Record<string, string> = {
  total_rows: 'Raw observatory rows',
  clean_pattern_rows: 'Rows strong enough for pattern review',
  unknown_insurer_rows: 'Rows missing a named insurer',
  unknown_category_rows: 'Rows missing a clean category',
  generic_procedure_rows: 'Rows still in a generic procedure bucket',
  missing_state_rows: 'Rows without usable state data',
  suspicious_or_state_rows: 'Rows with suspicious "OR" state extraction',
  low_signal_rows: 'Rows flagged as low signal',
};

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

  const heatMax = Math.max(...(data?.heatmap.map((item) => item.value) || [1]));

  return (
    <div className="min-h-screen bg-[#0a0c0f] px-5 py-10 text-[#f3efe9] md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[2.7rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(199,75,60,0.16),transparent_28%),linear-gradient(135deg,#101317_0%,#12171d_55%,#151b22_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-8 p-8 md:p-10 lg:grid-cols-[1.45fr_0.95fr] lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#c74b3c]/25 bg-white/6 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#f19a86]">
                Evidence Patterns
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#f7f2eb] md:text-6xl">
                  What the denials are starting to reveal.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#c8bdb4] md:text-lg">
                  This is where scattered complaint posts become patterns, outliers, and early warning signs. We show what is surfacing,
                  where the data is strong, and where the extraction still needs cleanup before anyone overclaims certainty.
                </p>
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
                  onClick={() => window.open('https://lookerstudio.google.com/', '_blank')}
                >
                  Open Looker Studio
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  label: 'Visible patterns',
                  value: data?.overview.cleanPatternRows || 0,
                  caption: 'The rows we can actually use in public-facing charts after basic filtering and cleanup.',
                  icon: Sparkles,
                },
                {
                  label: 'Raw observatory rows',
                  value: data?.overview.totalRows || 0,
                  caption: 'Everything we have pulled into the warehouse, including rows that still need more cleanup or better extraction.',
                  icon: Database,
                },
                {
                  label: 'Unknown insurer rate',
                  value: `${data?.overview.unknownInsurerPct || 0}%`,
                  caption: 'The share of raw rows where we still cannot confidently name the insurer.',
                  icon: AlertTriangle,
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
                <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">What these numbers actually mean</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Visible patterns',
                    body: 'These are the rows we feel comfortable using in the current charts. They are not perfect, but they are cleaner and more interpretable than the raw intake.',
                  },
                  {
                    title: 'Raw observatory rows',
                    body: 'This is the bigger intake bucket. It includes everything we pulled from public sources before all of the extraction, dedupe, and cleanup work is finished.',
                  },
                  {
                    title: 'Unknown insurer rate',
                    body: 'This is the share of raw rows where our pipeline still cannot confidently identify the payer. High unknown rates mean the pattern review is useful but not fully mature.',
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
                <CardTitle className="text-2xl tracking-tight">Why this observatory is different</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-white/78">
                <p>
                  We are trying to make sense of insurance complaints that are normally splintered across Reddit, public forums, complaint platforms, advocacy sites,
                  and official benchmark sources.
                </p>
                <p>
                  We pull public-source observations in, normalize insurer names and denial categories, try to identify procedures and treatments, and throw out obvious junk,
                  unrelated insurance chatter, and low-signal rows.
                </p>
                <p>
                  The result is not a perfect claims database. It is a cleaned, explainable observatory built to help patients, researchers, and advocates see patterns they
                  would otherwise miss.
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
                    Who is showing up the most
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-3">
                  {[
                    { title: 'Top insurers', rows: data.topInsurers },
                    { title: 'Top denial categories', rows: data.topCategories },
                    { title: 'Top procedures', rows: data.topProcedures },
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
                    Insurer x category pressure points
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {data.heatmap.map((item) => (
                    <HeatCell key={`${item.insurer}-${item.category}`} item={item} max={heatMax} />
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">Evidence patterns patients can use</CardTitle>
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
                            This combination is recurring enough to watch. It is one of the stronger insurer-procedure-category
                            clusters in the current cleaned slice.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9e9489]">Visible cases</p>
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
                      State signal
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
                      This map slice excludes suspicious state extraction, especially false Oregon hits from the word &quot;or&quot;.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                  <CardHeader>
                    <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">Source mix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.sourceMix.map((source) => (
                      <div key={source.label} className="flex items-center justify-between rounded-[1.2rem] bg-white/6 px-4 py-3">
                        <span className="text-sm font-semibold text-[#f7f2eb]">{source.label}</span>
                        <span className="text-sm text-[#c8bdb4]">{source.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-[2.3rem] border-white/8 bg-[#12161b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight text-[#f7f2eb]">Data quality reality check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.dataQuality.map((row) => (
                    <div key={row.metric} className="flex items-start justify-between gap-4 rounded-[1.3rem] bg-white/6 px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-[#f7f2eb]">{metricLabels[row.metric] || row.metric}</p>
                        <p className="mt-1 text-xs leading-5 text-[#c8bdb4]">{row.metric}</p>
                      </div>
                      <p className="text-2xl font-semibold tracking-tight text-[#f19a86]">{row.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-white/8 bg-[linear-gradient(160deg,#161b21_0%,#1d242c_100%)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight">What this means right now</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 text-sm leading-7 text-[#d8cdc5]">
                  <p>
                    The strongest pattern in the current slice is not just classic &quot;medical necessity&quot; language. Administrative friction,
                    prior authorization, out-of-network fights, and eligibility breakdowns are all surfacing heavily.
                  </p>
                  <p>
                    Prescription medications are the biggest procedure bucket right now, with surgery, fertility treatment, therapy services,
                    and MRI close enough behind to treat them as real battlegrounds instead of edge cases.
                  </p>
                  <p>
                    The charts are already useful for pattern review, but they are not perfectly clean. The next gains will come from better
                    insurer extraction, better denial-category normalization, and stricter procedure labeling across the raw warehouse.
                  </p>
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f0c8ba]">Looker-ready</p>
                    <p className="mt-3">
                      These slices are now structured well enough to back a Looker Studio observatory: trend dashboards, heatmaps,
                      insurer scorecards, and data-quality views.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f0c8ba]">How we clean</p>
                    <p className="mt-3">
                      We normalize insurer aliases, infer denial categories, identify procedures where we can, flag low-signal rows, and warn when extraction is still too weak
                      to support a confident public claim.
                    </p>
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
