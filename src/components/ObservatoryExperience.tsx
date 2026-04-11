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

const COLORS = ['#7f2f24', '#aa4f3b', '#cf7552', '#d8b39c', '#5a4a3f'];

const HERO_IMAGE =
  'https://images.pexels.com/photos/7927396/pexels-photo-7927396.jpeg?cs=srgb&dl=pexels-nicola-barts-7927396.jpg&fm=jpg';

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
    <div className="min-h-screen bg-[#f6efe8] text-[#1f1916]">
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2.8rem] border border-[#201613]/6 bg-[linear-gradient(135deg,#fffaf6_0%,#f5e7dc_48%,#ead8ca_100%)] shadow-[0_30px_90px_rgba(42,22,14,0.08)]">
          <div className="absolute inset-0">
            <img
              src={HERO_IMAGE}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center opacity-[0.16] saturate-[0.7]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,246,0.96)_0%,rgba(255,250,246,0.88)_42%,rgba(255,250,246,0.74)_100%)]" />
          </div>

          <div className="relative px-7 py-10 md:px-10 md:py-14">
            <Badge className="rounded-full border border-[#7f2f24]/12 bg-white/88 px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-[#7f2f24]">
              Public insurance denial observatory
            </Badge>

            <div className="mt-6 max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-[#1f1916] md:text-7xl"
              >
                Millions of denials.
                <br />
                One searchable observatory.
              </motion.h1>

              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#5f4d43] md:text-xl">
                We aggregate, normalize, and analyze health insurance denial stories in real-time. Turning thousands of individual frustrations
                into a collective force for change.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate('share')}
                  className="h-16 rounded-full bg-[#7f2f24] px-10 text-base font-semibold text-white shadow-[0_14px_40px_rgba(127,47,36,0.22)] hover:bg-[#6d261d]"
                >
                  Share your story <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onNavigate('appeal')}
                  variant="outline"
                  className="h-16 rounded-full border-[#1f1916]/10 bg-white/88 px-10 text-base font-semibold text-[#1f1916] hover:bg-white"
                >
                  Fight back with AI
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#6a584d]">
                <span className="rounded-full border border-[#201613]/8 bg-white/70 px-4 py-2">
                  {totalStories.toLocaleString()} real denial stories analyzed
                </span>
                <span className="rounded-full border border-[#201613]/8 bg-white/70 px-4 py-2">
                  Top denial pattern: {topCategory}
                </span>
                <span className="rounded-full border border-[#201613]/8 bg-white/70 px-4 py-2">
                  AI system: {aiStatus}
                </span>
              </div>

              <div className="mt-6 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d776c]" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    placeholder="Search insurer, medication, procedure"
                    className="h-11 rounded-full border-[#201613]/8 bg-white/88 pl-11 text-sm text-[#1f1916] placeholder:text-[#9a8577]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {featureCards.map((card, index) => (
            <motion.button
              key={card.title}
              onClick={() => onNavigate(card.tab)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 + index * 0.06, duration: 0.35 }}
              className="rounded-[2rem] border border-[#201613]/8 bg-white/84 p-6 text-left transition-transform hover:-translate-y-1"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7f2f24]">{card.eyebrow}</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#1f1916]">{card.title}</h2>
              <p className="mt-3 leading-relaxed text-[#69584d]">{card.text}</p>
            </motion.button>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.3rem] border border-[#201613]/8 bg-white/80 p-7 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7f2f24]">Pattern preview</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#1f1916]">Where denial pressure is clustering</h3>
              </div>
              <Button variant="ghost" className="rounded-full text-[#7f2f24]" onClick={() => onNavigate('insights')}>
                Open evidence patterns
              </Button>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.75rem] bg-[#fbf5ef] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-[#7f2f24]" />
                  <h4 className="font-semibold text-[#1f1916]">Top insurers in the current record</h4>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insurerData.slice(0, 6)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#6c5a4e', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fffaf6', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px' }} />
                      <Bar dataKey="value" fill="#7f2f24" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-[#fbf5ef] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#7f2f24]" />
                  <h4 className="font-semibold text-[#1f1916]">Source mix</h4>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData.slice(0, 5)} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={4}>
                        {sourceData.slice(0, 5).map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fffaf6', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.3rem] bg-[#201613] p-7 text-white md:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#f2c0a6]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f2c0a6]">Featured stories</p>
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
                    <a href={story.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-sm font-semibold text-[#f2c0a6]">
                      Source link <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2.4rem] border border-[#201613]/8 bg-[#efe4da] px-8 py-8 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7f2f24]">Clear paths</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#1f1916]">Do not blur collecting stories with writing appeals.</h3>
              <p className="mt-3 leading-relaxed text-[#69584d]">
                Sharing a story helps build precedent and community evidence. Fighting back is where we use that evidence to make your appeal smarter.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onNavigate('share')} className="rounded-full bg-[#201613] text-white hover:bg-[#32231d]">
                Share your story
              </Button>
              <Button onClick={() => onNavigate('appeal')} className="rounded-full bg-[#7f2f24] text-white hover:bg-[#6d261d]">
                Generate appeal
              </Button>
              <Button onClick={() => onNavigate('insights')} variant="outline" className="rounded-full border-black/10 bg-white/72">
                Evidence patterns
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
