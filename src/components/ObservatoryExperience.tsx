import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ExternalLink, Search, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'motion/react';
import type { DenialRecord } from '@/src/types';

type Datum = { name: string; value: number };

interface Props {
  featuredStories: DenialRecord[];
  liveDenials: DenialRecord[];
  totalStories: number;
  topCategory: string;
  aiStatus: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onNavigate: (tab: 'share' | 'appeal' | 'insights') => void;
  insurerData: Datum[];
  sourceData: Datum[];
  statusData: Datum[];
}

const COLORS = ['#c94f3d', '#d97757', '#8ca3ad', '#50606f', '#27313b'];

const HERO_IMAGE =
  'https://images.pexels.com/photos/8064274/pexels-photo-8064274.jpeg?auto=compress&cs=tinysrgb&w=1600';

const featureCards = [
  {
    eyebrow: 'Share your story',
    title: 'Start with what happened to you.',
    text: 'Tell the story in your own words, then let us structure it so other patients can find patterns, precedent, and what worked.',
    tab: 'share' as const,
  },
  {
    eyebrow: 'Fight back',
    title: 'Use real denial patterns to write a smarter appeal.',
    text: 'Bring your denial letter when you are ready to fight, and we will turn similar cases, insurer trends, and AI into a stronger draft.',
    tab: 'appeal' as const,
  },
  {
    eyebrow: 'Evidence patterns',
    title: 'See which insurers, drugs, and procedures keep getting blocked.',
    text: 'Track what is repeating across the observatory and where the data is clean enough to trust.',
    tab: 'insights' as const,
  },
];

export default function ObservatoryExperience({
  featuredStories,
  totalStories,
  topCategory,
  aiStatus,
  searchTerm,
  onSearchTermChange,
  onNavigate,
  insurerData,
  sourceData,
}: Props) {
  return (
    <div className="min-h-screen bg-[#0a0c0f] text-[#f7f2eb]">
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/8 bg-[#101317] shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
          <div className="absolute inset-0">
            <img
              src={HERO_IMAGE}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center opacity-[0.18] grayscale"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0.72)_0%,rgba(10,12,15,0.92)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,79,61,0.16),transparent_28%),linear-gradient(90deg,rgba(10,12,15,0.9)_0%,rgba(10,12,15,0.72)_45%,rgba(10,12,15,0.88)_100%)]" />
          </div>

          <div className="relative px-7 py-10 md:px-10 md:py-14 lg:px-12 lg:py-16">
            <Badge className="rounded-full border border-white/10 bg-white/6 px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-[#f3b4a7]">
              Public insurance denial observatory
            </Badge>

            <div className="mt-6 max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-[#f7f2eb] md:text-7xl"
              >
                Millions of denials.
                <br />
                One searchable observatory.
              </motion.h1>

              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#d1c7be] md:text-xl">
                We aggregate, normalize, and analyze health insurance denial stories in real-time. Turning thousands of individual frustrations
                into a collective force for change.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate('share')}
                  className="h-16 rounded-full bg-[#c94f3d] px-10 text-base font-semibold text-white shadow-[0_14px_40px_rgba(201,79,61,0.26)] hover:bg-[#b84333]"
                >
                  Share your story <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onNavigate('appeal')}
                  variant="outline"
                  className="h-16 rounded-full border-white/10 bg-white/6 px-10 text-base font-semibold text-[#f7f2eb] hover:bg-white/10"
                >
                  Fight back with AI
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#c5bab0]">
                <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                  {totalStories.toLocaleString()} real denial stories analyzed
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                  Top denial pattern: {topCategory}
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                  AI system: {aiStatus}
                </span>
              </div>

              <div className="mt-7 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8077]" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    placeholder="Search insurer, medication, procedure"
                    className="h-11 rounded-full border-white/10 bg-white/6 pl-11 text-sm text-[#f7f2eb] placeholder:text-[#94897f]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {featureCards.map((card, index) => (
            <motion.button
              key={card.title}
              onClick={() => onNavigate(card.tab)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 + index * 0.06, duration: 0.35 }}
              className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5 text-left transition-transform hover:-translate-y-1"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f0a694]">{card.eyebrow}</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#f7f2eb]">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#b8ada3]">{card.text}</p>
            </motion.button>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.3rem] border border-white/8 bg-[#11161b] p-7 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f0a694]">Pattern preview</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f7f2eb]">Where denial pressure is clustering</h3>
              </div>
              <Button variant="ghost" className="rounded-full text-[#f0a694]" onClick={() => onNavigate('insights')}>
                Open evidence patterns
              </Button>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.75rem] bg-[#0d1217] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-[#f0a694]" />
                  <h4 className="font-semibold text-[#f7f2eb]">Top insurers in the current record</h4>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insurerData.slice(0, 6)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#c9bfb5', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#13181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#f7f2eb' }} />
                      <Bar dataKey="value" fill="#c94f3d" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-[#0d1217] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#f0a694]" />
                  <h4 className="font-semibold text-[#f7f2eb]">Source mix</h4>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData.slice(0, 5)} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={4}>
                        {sourceData.slice(0, 5).map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#13181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#f7f2eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.3rem] bg-[linear-gradient(160deg,#13171c_0%,#191f26_100%)] p-7 text-white md:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#f0a694]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f0a694]">Featured stories</p>
            </div>
            <div className="mt-6 space-y-4">
              {featuredStories.slice(0, 3).map((story) => (
                <article key={story.id} className="rounded-[1.65rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <Badge className="rounded-full border-0 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/82">
                      {story.insurer || 'Private carrier'}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-white/42">{story.source || 'Public source'}</span>
                  </div>
                  <h4 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{story.procedure || 'Medical service denial'}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-white/68">{story.summary || story.denialReason}</p>
                  {story.url && (
                      <a href={story.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-sm font-semibold text-[#f0a694]">
                        Source link <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2.4rem] border border-white/8 bg-[linear-gradient(135deg,#11161b_0%,#171d24_100%)] px-8 py-8 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f0a694]">Clear paths</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f7f2eb]">Do not blur collecting stories with writing appeals.</h3>
              <p className="mt-3 leading-relaxed text-[#b8ada3]">
                Sharing a story helps build precedent and community evidence. Fighting back is where we use that evidence to make your appeal smarter.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onNavigate('share')} className="rounded-full bg-[#f7f2eb] text-[#11161b] hover:bg-[#ebe3da]">
                Share your story
              </Button>
              <Button onClick={() => onNavigate('appeal')} className="rounded-full bg-[#c94f3d] text-white hover:bg-[#b84333]">
                Generate appeal
              </Button>
              <Button onClick={() => onNavigate('insights')} variant="outline" className="rounded-full border-white/10 bg-white/6 text-[#f7f2eb] hover:bg-white/10">
                Evidence patterns
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
