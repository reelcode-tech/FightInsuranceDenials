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

const BAR_COLORS = ['#b43c2e', '#d6785f', '#a1887f', '#9fb5a5', '#647b78', '#394a59'];

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
    return 'border-[#d6785f]/40 bg-[#fff1e8] text-[#7f3124]';
  }
  if (tone === 'high') {
    return 'border-[#b43c2e]/35 bg-[#fff7f5] text-[#7e2f24]';
  }
  return 'border-[#d9d1c8] bg-white text-[#3b312c]';
}

function prettifyLabel(label: string) {
  return label.length > 26 ? `${label.slice(0, 26)}…` : label;
}

function HeatCell({ item, max }: { item: HeatmapRow; max: number }) {
  const intensity = max ? item.value / max : 0;
  const alpha = 0.2 + intensity * 0.65;
  return (
    <div
      className="rounded-[1.6rem] border border-[#b43c2e]/10 p-5 transition-transform duration-200 hover:-translate-y-1"
      style={{ backgroundColor: `rgba(180, 60, 46, ${alpha})` }}
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
    <div className="min-h-screen bg-[#f4efe8] px-5 py-10 text-[#1f1b17] md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[2.7rem] border border-black/5 bg-[linear-gradient(135deg,#f8f1eb_0%,#f3e4da_55%,#eadfd6_100%)] shadow-[0_28px_90px_rgba(48,31,23,0.08)]">
          <div className="grid gap-8 p-8 md:p-10 lg:grid-cols-[1.45fr_0.95fr] lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-[#b43c2e]/15 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#b43c2e]">
                Evidence Patterns
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#1f1b17] md:text-6xl">
                  What the denials are starting to reveal.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#5f5348] md:text-lg">
                  This is where scattered complaint posts become patterns, outliers, and early warning signs. We show what is surfacing,
                  where the data is strong, and where the extraction still needs cleanup before anyone overclaims certainty.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => load('refresh')}
                  className="rounded-full bg-[#b43c2e] px-5 text-white hover:bg-[#9f3226]"
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh pattern review
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-black/10 bg-white/70 text-[#1f1b17] hover:bg-white"
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
                  className="rounded-[2rem] border border-black/5 bg-white/80 p-5 shadow-[0_16px_45px_rgba(48,31,23,0.06)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8c7b6e]">{item.label}</p>
                    <item.icon className="h-4 w-4 text-[#b43c2e]" />
                  </div>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#1f1b17]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6259]">{item.caption}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {data ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[2.2rem] border-black/5 bg-white/80 shadow-[0_18px_55px_rgba(48,31,23,0.05)]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">What these numbers actually mean</CardTitle>
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
                  <div key={item.title} className="rounded-[1.5rem] bg-[#fffaf6] p-5">
                    <p className="text-sm font-semibold text-[#1f1b17]">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-[#6f6259]">{item.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2.2rem] border-black/5 bg-[#102933] text-white shadow-[0_20px_60px_rgba(16,41,51,0.18)]">
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
          <Card className="border-[#d6785f]/30 bg-[#fff2ea]">
            <CardContent className="p-6 text-[#7f3124]">{error}</CardContent>
          </Card>
        )}

        {loading && !data ? (
          <Card className="rounded-[2rem] border-black/5 bg-white/80">
            <CardContent className="flex h-64 items-center justify-center text-[#6f6259]">
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
              <Card className="rounded-[2.3rem] border-black/5 bg-white/75 shadow-[0_20px_60px_rgba(48,31,23,0.05)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight">
                    <BarChart3 className="h-5 w-5 text-[#b43c2e]" />
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
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8b7d70]">{block.title}</p>
                      </div>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={block.rows} layout="vertical" margin={{ left: 6, right: 6 }}>
                            <CartesianGrid stroke="#e7ddd4" strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                              type="category"
                              dataKey="label"
                              width={92}
                              tick={{ fill: '#6f6259', fontSize: 12 }}
                              tickFormatter={prettifyLabel}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(180,60,46,0.06)' }}
                              contentStyle={{
                                backgroundColor: '#fffaf6',
                                borderRadius: '16px',
                                border: '1px solid rgba(31,27,23,0.06)',
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

              <Card className="rounded-[2.3rem] border-black/5 bg-white/75 shadow-[0_20px_60px_rgba(48,31,23,0.05)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl tracking-tight">
                    <Target className="h-5 w-5 text-[#b43c2e]" />
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
              <Card className="rounded-[2.3rem] border-black/5 bg-white/75 shadow-[0_20px_60px_rgba(48,31,23,0.05)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight">Evidence patterns patients can use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.procedureClusters.map((cluster, index) => (
                    <motion.div
                      key={`${cluster.procedure}-${cluster.insurer}-${cluster.category}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-[1.8rem] border border-black/5 bg-[#fffaf6] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#f3e4da] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-[#9f3226]">
                          {cluster.insurer}
                        </span>
                        <span className="rounded-full bg-[#ece5dd] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-[#675a50]">
                          {cluster.category}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-semibold tracking-tight text-[#1f1b17]">{cluster.procedure}</h4>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6259]">
                            This combination is recurring enough to watch. It is one of the stronger insurer-procedure-category
                            clusters in the current cleaned slice.
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8b7d70]">Visible cases</p>
                          <p className="text-4xl font-semibold tracking-[-0.05em] text-[#b43c2e]">{cluster.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="rounded-[2.3rem] border-black/5 bg-white/75 shadow-[0_20px_60px_rgba(48,31,23,0.05)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl tracking-tight">
                      <MapPinned className="h-5 w-5 text-[#b43c2e]" />
                      State signal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.statePatterns.map((state) => (
                      <div key={state.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#312822]">{state.label}</span>
                          <span className="text-[#6f6259]">{state.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#ece5dd]">
                          <div
                            className="h-2 rounded-full bg-[#b43c2e]"
                            style={{
                              width: `${Math.max(10, (state.value / (data.statePatterns[0]?.value || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-sm leading-6 text-[#6f6259]">
                      This map slice excludes suspicious state extraction, especially false Oregon hits from the word &quot;or&quot;.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.3rem] border-black/5 bg-white/75 shadow-[0_20px_60px_rgba(48,31,23,0.05)]">
                  <CardHeader>
                    <CardTitle className="text-2xl tracking-tight">Source mix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.sourceMix.map((source) => (
                      <div key={source.label} className="flex items-center justify-between rounded-[1.2rem] bg-[#fffaf6] px-4 py-3">
                        <span className="text-sm font-semibold text-[#312822]">{source.label}</span>
                        <span className="text-sm text-[#6f6259]">{source.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-[2.3rem] border-black/5 bg-white/75 shadow-[0_20px_60px_rgba(48,31,23,0.05)]">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-tight">Data quality reality check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.dataQuality.map((row) => (
                    <div key={row.metric} className="flex items-start justify-between gap-4 rounded-[1.3rem] bg-[#fffaf6] px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-[#312822]">{metricLabels[row.metric] || row.metric}</p>
                        <p className="mt-1 text-xs leading-5 text-[#6f6259]">{row.metric}</p>
                      </div>
                      <p className="text-2xl font-semibold tracking-tight text-[#b43c2e]">{row.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.3rem] border-black/5 bg-[linear-gradient(160deg,#1f1b17_0%,#2b221d_100%)] text-white shadow-[0_24px_80px_rgba(31,27,23,0.24)]">
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
