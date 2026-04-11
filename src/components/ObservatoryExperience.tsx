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
        <section className="overflow-hidden rounded-[2.8rem] border border-[#201613]/6 bg-[linear-gradient(135deg,#fffaf6_0%,#f5e7dc_48%,#ead8ca_100%)] shadow-[0_30px_90px_rgba(42,22,14,0.08)]">
          <div className="px-7 py-8 md:px-10 md:py-10">
            <Badge className="rounded-full border border-[#7f2f24]/12 bg-white/88 px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-[#7f2f24]">
              Public insurance denial observatory
            </Badge>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.26em] text-[#7f2f24]/82">What denial feels like</p>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-[#1f1916] md:text-7xl"
                >
                  They say no.
                  <br />
                  Your health pays for it.
                </motion.h1>

                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#5f4d43] md:text-xl">
                  One searchable record for the people who get denied, delayed, priced out, and left alone to figure out a system that was
                  built to outlast them.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    onClick={() => onNavigate('share')}
                    className="h-16 rounded-full bg-[#7f2f24] px-9 text-base font-semibold text-white shadow-[0_14px_40px_rgba(127,47,36,0.22)] hover:bg-[#6d261d]"
                  >
                    Share your story <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onNavigate('appeal')}
                    variant="outline"
                    className="h-16 rounded-full border-[#1f1916]/10 bg-white/86 px-9 text-base font-semibold text-[#1f1916] hover:bg-white"
                  >
                    Fight back with AI
                  </Button>
                </div>

                <div className="mt-6 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d776c]" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => onSearchTermChange(e.target.value)}
                      placeholder="Search insurer, medication, procedure"
                      className="h-11 rounded-full border-[#201613]/8 bg-white/90 pl-11 text-sm text-[#1f1916] placeholder:text-[#9a8577]"
                    />
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="relative overflow-hidden rounded-[2.3rem] border border-white/50 bg-[#cab09c] shadow-[0_24px_70px_rgba(59,31,21,0.18)]"
              >
                <img
                  src={HERO_IMAGE}
                  alt="Person sitting with overdue letters and paperwork, looking emotionally drained"
                  className="h-[420px] w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,15,11,0.02)_0%,rgba(25,15,11,0.38)_68%,rgba(25,15,11,0.74)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.18 }}
                    className="max-w-sm rounded-[1.7rem] border border-white/14 bg-[#201613]/68 p-5 backdrop-blur-md"
                  >
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/62">Why this exists</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Denial is not just paperwork.</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/72">
                      It is delayed medication, missed care, more debt, and the feeling that the system is bigger than you.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            <div className="mt-8 grid max-w-6xl gap-4 md:grid-cols-3">
              {[
                { label: 'Stories in the record', value: totalStories.toLocaleString(), note: 'Cleaned public stories and structured denial evidence' },
                { label: 'Top denial pattern', value: topCategory, note: 'What is surfacing most in the observatory right now' },
                { label: 'AI support system', value: aiStatus, note: 'Extraction, grouping, and appeal-writing support grounded in our data' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  className="rounded-[1.8rem] border border-[#201613]/6 bg-white/74 p-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#8d776c]">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#1f1916]">{item.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#69584d]">{item.note}</p>
                </motion.div>
              ))}
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
