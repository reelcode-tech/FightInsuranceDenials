import React from 'react';
import { Copy, Download, Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, Cell, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPublicStoryCount, normalizePublicStoryCount } from '@/src/lib/publicMetrics';

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
  snapshot?: {
    meta: { updatedLabel: string; usableRows: string; source: string };
  };
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
    filters: {
      insurers: string[];
      reasons: string[];
      states: string[];
    };
    charts: {
      insurerShare: MetricRow[];
      stateShare: MetricRow[];
      timeline: TimelineRow[];
    };
  };
};

const DONUT_COLORS = ['#0f5ea8', '#2a7cc7', '#31a68e', '#6fc8b7', '#8fd6cc', '#c8dde3'];
const FILTER_PRESETS = ['All Insurers', 'All Reasons', 'My State'];
const TIME_WINDOWS = ['Last 12 months', 'All time'];
const ACTION_CARDS = [
  {
    title: 'Use this chart in your appeal',
    body: 'Copy the citation, then explain that your denial matches a repeat pattern already visible in the public record.',
    tab: 'appeal',
    cta: 'Open Fight Back',
  },
  {
    title: 'Search the matching stories',
    body: 'Move from the chart to the actual patient stories that use the same insurer, treatment, or denial language.',
    tab: 'insights',
    cta: 'Open Evidence Patterns',
  },
  {
    title: 'Strengthen the record',
    body: 'If your denial is missing, add it so the next patient has more precedent to cite.',
    tab: 'share',
    cta: 'Share your story',
  },
];

const STATE_TILE_POSITIONS: Record<string, { col: number; row: number }> = {
  WA: { col: 0, row: 1 }, OR: { col: 0, row: 2 }, CA: { col: 0, row: 3 }, AK: { col: 0, row: 6 }, HI: { col: 1, row: 6 },
  ID: { col: 1, row: 2 }, NV: { col: 1, row: 3 }, AZ: { col: 1, row: 4 }, MT: { col: 2, row: 1 }, WY: { col: 2, row: 2 },
  UT: { col: 2, row: 3 }, CO: { col: 2, row: 4 }, NM: { col: 2, row: 5 }, ND: { col: 3, row: 1 }, SD: { col: 3, row: 2 },
  NE: { col: 3, row: 3 }, KS: { col: 3, row: 4 }, OK: { col: 3, row: 5 }, TX: { col: 3, row: 6 }, MN: { col: 4, row: 1 },
  IA: { col: 4, row: 2 }, MO: { col: 4, row: 3 }, AR: { col: 4, row: 4 }, LA: { col: 4, row: 5 }, WI: { col: 5, row: 1 },
  IL: { col: 5, row: 2 }, MS: { col: 5, row: 5 }, MI: { col: 6, row: 1 }, IN: { col: 6, row: 2 }, KY: { col: 6, row: 3 },
  TN: { col: 6, row: 4 }, AL: { col: 6, row: 5 }, GA: { col: 7, row: 5 }, FL: { col: 8, row: 6 }, OH: { col: 7, row: 2 },
  WV: { col: 7, row: 3 }, VA: { col: 8, row: 3 }, NC: { col: 8, row: 4 }, SC: { col: 8, row: 5 }, PA: { col: 8, row: 2 },
  NY: { col: 9, row: 1 }, VT: { col: 10, row: 0 }, NH: { col: 11, row: 0 }, ME: { col: 12, row: 0 }, NJ: { col: 9, row: 2 },
  MD: { col: 9, row: 3 }, DE: { col: 10, row: 3 }, CT: { col: 10, row: 1 }, RI: { col: 11, row: 1 }, MA: { col: 11, row: 0 },
  DC: { col: 10, row: 4 },
};

const STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT',
  Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI',
  Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH',
  Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
};

function normalizeStateCode(label: string) {
  if (!label) return '';
  const trimmed = label.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_CODE[trimmed] || '';
}

function intensityColor(value: number, maxValue: number) {
  if (!value || !maxValue) return '#d8e6ed';
  const ratio = value / maxValue;
  if (ratio > 0.8) return '#0f5ea8';
  if (ratio > 0.55) return '#2a7cc7';
  if (ratio > 0.35) return '#31a68e';
  if (ratio > 0.18) return '#74cfbf';
  return '#b9dde0';
}

function formatCitation(insurer: string, stories: number, reason: string, successRate: number, windowLabel: string) {
  return `According to FightInsuranceDenials (${new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })}), the current ${windowLabel.toLowerCase()} view covers ${formatPublicStoryCount(stories)} public stories. ${insurer} appears most often, ${reason} is the most repeated denial reason, and the database currently shows an appeal success signal of ${successRate}% in stories with recorded outcomes.`;
}

function exportDashboardPdf(title: string, totals: DashboardResponse['dashboard']['totals'], methodology: string, windowLabel: string) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(title, 16, 22);
    doc.setFontSize(11);
    doc.text(`Published stories: ${formatPublicStoryCount(totals.publishedStories)}`, 16, 40);
    doc.text(`Top insurer: ${totals.topInsurer}`, 16, 48);
    doc.text(`Top denial reason: ${totals.topCategory}`, 16, 56);
    doc.text(`Appeal success signal: ${totals.appealSuccessRate}%`, 16, 64);
    doc.text(`Window: ${windowLabel}`, 16, 72);
    doc.text(methodology, 16, 88, { maxWidth: 178 });
    doc.save('fight-insurance-denials-dashboard.pdf');
  });
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7c8c]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function StateTileMap({ rows }: { rows: MetricRow[] }) {
  const valuesByCode = React.useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const code = normalizeStateCode(row.label);
      if (code) map.set(code, row.value);
    });
    return map;
  }, [rows]);

  const maxValue = Math.max(...Array.from(valuesByCode.values()), 0);
  const tileWidth = 32;
  const tileHeight = 26;
  const gap = 6;

  return (
    <svg viewBox="0 0 520 280" className="h-full w-full">
      {Object.entries(STATE_TILE_POSITIONS).map(([code, position]) => {
        const x = position.col * (tileWidth + gap);
        const y = position.row * (tileHeight + gap);
        const value = valuesByCode.get(code) || 0;
        return (
          <g key={code} transform={`translate(${x}, ${y})`}>
            <rect rx="9" width={tileWidth} height={tileHeight} fill={intensityColor(value, maxValue)} stroke="rgba(10,41,66,0.12)" />
            <text x={tileWidth / 2} y={16} textAnchor="middle" fontSize="10" fill={value > 0 ? '#f8fcff' : '#5a7486'} fontWeight="700">
              {code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DataVisualizations() {
  const [payload, setPayload] = React.useState<DashboardResponse | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('All Insurers');
  const [timeWindow, setTimeWindow] = React.useState('Last 12 months');
  const [copyState, setCopyState] = React.useState<'idle' | 'done'>('idle');

  React.useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/insights/dashboard', { cache: 'no-store' });
      const json = await response.json();
      setPayload(json);
    };

    load().catch((error) => console.error('Failed to load data visualizations', error));
  }, []);

  const dashboard = payload?.dashboard;
  const snapshot = payload?.snapshot;
  const insurerShare = dashboard?.charts.insurerShare || [];
  const stateShare = dashboard?.charts.stateShare || [];
  const timeline = dashboard?.charts.timeline || [];
  const totals = dashboard?.totals;
  const publishedStories = normalizePublicStoryCount(totals?.publishedStories);

  const citation = totals
    ? formatCitation(totals.topInsurer, publishedStories, totals.topCategory, totals.appealSuccessRate, dashboard?.windowLabel || timeWindow)
    : '';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fcfd_0%,#eff8fb_100%)] px-4 py-8 text-[#12324a] md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2.8rem] border border-[#d8e8ef] bg-[radial-gradient(circle_at_top_left,rgba(85,188,204,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(103,204,156,0.15),transparent_24%),linear-gradient(180deg,#fbfeff_0%,#f1fbfc_100%)] p-6 shadow-[0_30px_80px_rgba(21,75,112,0.12)] md:p-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe4ea] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">
              <span>{formatPublicStoryCount(publishedStories)} stories</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#3bb995]" />
              <span>{dashboard?.windowLabel || timeWindow}</span>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-end">
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl text-[#0e2b43] md:text-6xl">Denial patterns you can actually use in an appeal.</h1>
                <p className="max-w-3xl text-base leading-7 text-[#557082] md:text-lg">
                  Search the record, filter the biggest repeat patterns, and copy a citation you can paste into your appeal packet.
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-[#d7e8ee] bg-white/88 p-4 text-sm leading-7 text-[#557082]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2e7888]">Methodology</p>
                <p className="mt-2">{dashboard?.methodology || 'Counts reflect the current published public stories in the live database and are refreshed from the production API.'}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#d7e8ee] bg-white/88 p-4 shadow-[0_16px_44px_rgba(34,95,130,0.08)]">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f91a0]" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder='Search my denial (e.g. "GLP-1 prior auth denied")'
                    className="h-14 w-full rounded-[1.25rem] border border-[#d5e6ec] bg-[#f9fdff] pl-12 pr-4 text-[15px] text-[#12324a] outline-none transition focus:border-[#55bccc]"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {FILTER_PRESETS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        activeFilter === filter
                          ? 'border-[#1d7288] bg-[#e6f7fb] text-[#12536a]'
                          : 'border-[#d5e6ec] bg-white text-[#557082] hover:bg-[#f4fbfd]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                  {TIME_WINDOWS.map((windowOption) => (
                    <button
                      key={windowOption}
                      type="button"
                      onClick={() => setTimeWindow(windowOption)}
                      className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        timeWindow === windowOption
                          ? 'border-[#1d7288] bg-[#e6f7fb] text-[#12536a]'
                          : 'border-[#d5e6ec] bg-white text-[#557082] hover:bg-[#f4fbfd]'
                      }`}
                    >
                      {windowOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_22px_50px_rgba(26,77,111,0.08)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Insurer denial share</p>
                <h2 className="mt-2 text-3xl text-[#0e2b43]">Who keeps surfacing first</h2>
              </div>
              <div className="rounded-[1.3rem] border border-[#d7e8ee] bg-[#f7fcfe] px-4 py-3 text-right text-sm text-[#557082]">
                <p>{formatPublicStoryCount(publishedStories)} public stories</p>
                <p>{totals?.appealSuccessRate || 0}% appeal success signal</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-4">
              <LegendDot color="#0f5ea8" label="Denial share" />
              <LegendDot color="#31a68e" label="Appeal success signal" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={insurerShare} dataKey="value" nameKey="label" innerRadius={72} outerRadius={112} paddingAngle={3}>
                      {insurerShare.map((row, index) => (
                        <Cell key={row.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, entry: any) => [`${value.toLocaleString()} stories`, entry.payload.label]}
                      contentStyle={{ borderRadius: 18, border: '1px solid #d5e6ec', background: '#ffffff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {insurerShare.map((item, index) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-[#e1eef2] bg-[#f9fdff] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                        <span className="text-sm font-semibold text-[#12324a]">{item.label}</span>
                      </div>
                      <span className="text-sm text-[#557082]">{item.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-[#d7e8ee] bg-[#f7fcfe] p-4">
              <p className="text-sm leading-7 text-[#557082]">
                Plain English: this shows which insurers appear most often in the public record, plus the overall appeal success signal in stories where a real outcome was documented.
              </p>
              <p className="mt-2 text-sm font-medium text-[#2c7488]">How to use this in your appeal (2 minutes)</p>
            </div>
          </article>

          <article className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_22px_50px_rgba(26,77,111,0.08)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Denial frequency by state</p>
                <h2 className="mt-2 text-3xl text-[#0e2b43]">Where patients are reporting the same fights</h2>
              </div>
              <Button variant="outline" className="rounded-full border-[#d5e6ec] bg-white text-[#12324a] hover:bg-[#f4fbfd]">
                <Share2 className="mr-2 h-4 w-4" />
                Share view
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-4">
              <LegendDot color="#0f5ea8" label="Higher story volume" />
              <LegendDot color="#b9dde0" label="Lower story volume" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="rounded-[1.8rem] border border-[#e2eef2] bg-[#f7fcfe] p-4">
                <StateTileMap rows={stateShare} />
              </div>
              <div className="rounded-[1.8rem] border border-[#dcebf0] bg-[linear-gradient(180deg,#f8fdff_0%,#eef9fb_100%)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Top states in the current view</p>
                <div className="mt-4 space-y-4">
                  {stateShare.slice(0, 4).map((state) => (
                    <div key={state.label}>
                      <div className="flex items-center justify-between text-sm font-semibold text-[#12324a]">
                        <span>{state.label}</span>
                        <span>{state.value.toLocaleString()} stories</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[#d8ebf0]">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#2a7cc7,#31a68e)]"
                          style={{ width: `${Math.max(16, (state.value / Math.max(...stateShare.map((item) => item.value), 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-[#5f7c8c]">
                  Per-capita note: darker tiles indicate more stories per million residents where population-normalized comparisons are available; lighter tiles mean lower public reporting volume.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-[#d7e8ee] bg-[#f7fcfe] p-4">
              <p className="text-sm leading-7 text-[#557082]">
                Plain English: this helps you see whether your state already has enough public reporting to support a “this keeps happening here” argument.
              </p>
              <p className="mt-2 text-sm font-medium text-[#2c7488]">How to use this in your appeal (2 minutes)</p>
            </div>
          </article>
        </section>

        <section className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_22px_50px_rgba(26,77,111,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Trending patterns over time</p>
              <h2 className="mt-2 text-3xl text-[#0e2b43]">What is rising in the live record</h2>
            </div>
            <div className="rounded-full border border-[#d6e7ed] bg-[#f7fcfe] px-4 py-2 text-sm font-semibold text-[#2c7488]">
              {dashboard?.windowLabel || timeWindow}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-4">
            <LegendDot color="#2a7cc7" label="Story volume" />
            <LegendDot color="#31a68e" label="Appeal success rate" />
          </div>
          <div className="mt-6 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ left: 6, right: 12, top: 18, bottom: 0 }}>
                <defs>
                  <linearGradient id="timelinePrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2a7cc7" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2a7cc7" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="shortLabel" tick={{ fill: '#6b8797', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#6b8797', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#6b8797', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number, name: string) => (name === 'successRate' ? `${value}%` : `${value.toLocaleString()} stories`)}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ borderRadius: 18, border: '1px solid #d5e6ec', background: '#ffffff' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="value" name="Story volume" stroke="#2a7cc7" fill="url(#timelinePrimary)" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="successRate" stroke="#31a68e" strokeWidth={3} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-[#d7e8ee] bg-[#f7fcfe] p-4">
            <p className="text-sm leading-7 text-[#557082]">
              Plain English: the blue area shows how many public stories were added each month, while the green line shows the share of those stories that recorded an overturned appeal outcome.
            </p>
            <p className="mt-2 text-sm font-medium text-[#2c7488]">How to use this in your appeal (2 minutes)</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ACTION_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: card.tab }))}
              className="rounded-[1.8rem] border border-[#dbeaf0] bg-white p-5 text-left shadow-[0_12px_30px_rgba(36,88,122,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(36,88,122,0.08)]"
            >
              <p className="text-lg font-semibold text-[#12324a]">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-[#5f7c8c]">{card.body}</p>
              <p className="mt-4 text-sm font-semibold text-[#0f5ea8]">{card.cta}</p>
            </button>
          ))}
        </section>

        <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[#d7e8ee] bg-white p-5 shadow-[0_16px_44px_rgba(34,95,130,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#12324a]">Copy a ready-to-paste citation for your appeal packet.</p>
            <p className="mt-1 text-sm leading-7 text-[#5f7c8c]">{citation}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => totals && exportDashboardPdf('FightInsuranceDenials dashboard snapshot', totals, dashboard?.methodology || '', dashboard?.windowLabel || timeWindow)}
              className="rounded-full bg-[#0f5ea8] text-white hover:bg-[#0d528f]"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!citation) return;
                await navigator.clipboard.writeText(citation);
                setCopyState('done');
                window.setTimeout(() => setCopyState('idle'), 1800);
              }}
              className="rounded-full border-[#d5e6ec] bg-white text-[#12324a] hover:bg-[#f4fbfd]"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copyState === 'done' ? 'Citation copied' : 'Copy appeal citation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
