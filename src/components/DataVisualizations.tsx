import React from 'react';
import { Copy, Download, Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type MetricRow = { label: string; value: number };

type TimelineRow = {
  label: string;
  shortLabel: string;
  value: number;
  rollingAverage: number;
};

type DashboardResponse = {
  status: 'success' | 'error';
  snapshot?: {
    meta: { updatedLabel: string; usableRows: string; source: string };
  };
  dashboard?: {
    totals: {
      publishedStories: number;
      topInsurer: string;
      topCategory: string;
      topProcedure: string;
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

const DONUT_COLORS = ['#0f5ea8', '#2a7cc7', '#2ea89a', '#69c2bb', '#8fd0c9', '#c8dde3'];
const FILTER_PRESETS = ['All Insurers', 'All Reasons', 'My State', 'Last 30 days'];
const ACTION_CARDS = [
  {
    title: 'Take these patterns into your appeal',
    body: 'Turn the matching insurer, denial reason, and care trend into a sharper appeal draft instead of a generic complaint.',
    cta: 'Open Fight Back',
    tab: 'appeal',
  },
  {
    title: 'Search the matching stories',
    body: 'Use the public record to find the patients whose denial language looks closest to yours.',
    cta: 'Open Evidence Patterns',
    tab: 'insights',
  },
  {
    title: 'Add your own denial to the record',
    body: 'Every new anonymized story makes the public evidence stronger for the next patient.',
    cta: 'Share your story',
    tab: 'share',
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
  if (ratio > 0.35) return '#2ea89a';
  if (ratio > 0.18) return '#69c2bb';
  return '#b9dde0';
}

function formatCitation(insurer: string, reason: string, stories: number) {
  return `According to FightInsuranceDenials public database (${new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })}), ${insurer} appears in ${stories.toLocaleString()} public stories and ${reason} is the most repeated denial reason in the current record.`;
}

function exportDashboardPdf(title: string, totals: DashboardResponse['dashboard']['totals']) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(title, 16, 22);
    doc.setFontSize(11);
    doc.text(`Published stories: ${totals.publishedStories.toLocaleString()}`, 16, 40);
    doc.text(`Top insurer: ${totals.topInsurer}`, 16, 48);
    doc.text(`Top denial reason: ${totals.topCategory}`, 16, 56);
    doc.text(`Top treatment pattern: ${totals.topProcedure}`, 16, 64);
    doc.save('fight-insurance-denials-dashboard.pdf');
  });
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
            <rect
              rx="9"
              width={tileWidth}
              height={tileHeight}
              fill={intensityColor(value, maxValue)}
              stroke="rgba(10,41,66,0.12)"
            />
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

  const citation = totals
    ? formatCitation(totals.topInsurer, totals.topCategory, totals.publishedStories)
    : '';

  const topState = stateShare[0];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fcfd_0%,#eff8fb_100%)] px-5 py-10 text-[#12324a] md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2.8rem] border border-[#d8e8ef] bg-[radial-gradient(circle_at_top_left,rgba(85,188,204,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(103,204,156,0.15),transparent_24%),linear-gradient(180deg,#fbfeff_0%,#f1fbfc_100%)] p-8 shadow-[0_30px_80px_rgba(21,75,112,0.12)] md:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe4ea] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2e7888]">
              <span>{snapshot?.meta.usableRows || 'Live'}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#3bb995]" />
              <span>{snapshot?.meta.updatedLabel || 'Loading dashboard'}</span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl text-[#0e2b43] md:text-6xl">Denial Patterns at a Glance</h1>
              <p className="max-w-3xl text-lg leading-8 text-[#557082]">
                Search, filter, and export the strongest public patterns in the record so you can move from panic to proof in a few minutes.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#d7e8ee] bg-white/88 p-4 shadow-[0_16px_44px_rgba(34,95,130,0.08)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                  <Button
                    onClick={() => totals && exportDashboardPdf('FightInsuranceDenials dashboard snapshot', totals)}
                    className="rounded-full bg-[#0f5ea8] text-white hover:bg-[#0d528f]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export this view as PDF
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_22px_50px_rgba(26,77,111,0.08)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Insurer denial share</p>
                <h2 className="mt-2 text-3xl text-[#0e2b43]">Who keeps surfacing first</h2>
              </div>
              <div className="text-right text-sm text-[#648294]">
                <p>{totals?.publishedStories?.toLocaleString() || '0'} public stories</p>
                <p>{totals?.topCategory || 'Loading'} dominant</p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={insurerShare}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={78}
                      outerRadius={118}
                      paddingAngle={3}
                    >
                      {insurerShare.map((row, index) => (
                        <Cell key={row.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, entry: any) => [`${value.toLocaleString()} stories`, entry.payload.label]}
                      contentStyle={{ borderRadius: 18, border: '1px solid #d5e6ec', background: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {insurerShare.map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[1.2rem] border border-[#e1eef2] bg-[#f9fdff] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                      <span className="text-sm font-semibold text-[#12324a]">{item.label}</span>
                    </div>
                    <span className="text-sm text-[#557082]">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[2.3rem] border border-[#d6e7ed] bg-white p-6 shadow-[0_22px_50px_rgba(26,77,111,0.08)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">Denial frequency by state</p>
                <h2 className="mt-2 text-3xl text-[#0e2b43]">Where the stories are clustering</h2>
              </div>
              <Button variant="outline" className="rounded-full border-[#d5e6ec] bg-white text-[#12324a] hover:bg-[#f4fbfd]">
                <Share2 className="mr-2 h-4 w-4" />
                Share view
              </Button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="rounded-[1.8rem] border border-[#e2eef2] bg-[#f7fcfe] p-4">
                <StateTileMap rows={stateShare} />
              </div>
              <div className="rounded-[1.8rem] border border-[#dcebf0] bg-[linear-gradient(180deg,#f8fdff_0%,#eef9fb_100%)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e7888]">
                  Top denial reasons in {topState?.label || 'your state'}
                </p>
                <div className="mt-4 space-y-4">
                  {stateShare.slice(0, 4).map((state, index) => (
                    <div key={state.label}>
                      <div className="flex items-center justify-between text-sm font-semibold text-[#12324a]">
                        <span>{state.label}</span>
                        <span>{state.value.toLocaleString()} stories</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[#d8ebf0]">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#2a7cc7,#2ea89a)]"
                          style={{ width: `${Math.max(16, (state.value / Math.max(...stateShare.map((item) => item.value), 1)) * 100)}%` }}
                        />
                      </div>
                      {index === 0 ? (
                        <p className="mt-2 text-sm leading-6 text-[#5f7c8c]">
                          The strongest state cluster usually means more public stories, not necessarily more true denials, but it gives patients a place to start comparing language fast.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
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
              {totals?.topProcedure || 'Prescription medication'} remains the clearest care fight
            </div>
          </div>
          <div className="mt-6 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ left: 6, right: 12, top: 18, bottom: 0 }}>
                <defs>
                  <linearGradient id="timelinePrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2a7cc7" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2a7cc7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="timelineAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2ea89a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2ea89a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="shortLabel" tick={{ fill: '#6b8797', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b8797', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} stories`}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ borderRadius: 18, border: '1px solid #d5e6ec', background: '#ffffff' }}
                />
                <Area type="monotone" dataKey="rollingAverage" stroke="#2ea89a" fill="url(#timelineAverage)" strokeWidth={2} />
                <Area type="monotone" dataKey="value" stroke="#2a7cc7" fill="url(#timelinePrimary)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {ACTION_CARDS.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: card.tab }))}
                className="rounded-[1.6rem] border border-[#dbeaf0] bg-[#f8fdff] p-5 text-left shadow-[0_12px_30px_rgba(36,88,122,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(36,88,122,0.08)]"
              >
                <p className="text-lg font-semibold text-[#12324a]">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-[#5f7c8c]">{card.body}</p>
                <p className="mt-4 text-sm font-semibold text-[#0f5ea8]">{card.cta}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
