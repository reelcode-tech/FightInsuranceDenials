import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowRight, Clock, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import AppealGenerator from './AppealGenerator';

export default function AppealTools() {
  const [activeTool, setActiveTool] = useState<'generator' | 'benchmarks' | 'tracker'>('generator');
  const [benchmarkInsurer, setBenchmarkInsurer] = useState('UnitedHealthcare');
  const [benchmarkData, setBenchmarkData] = useState<{ success: number; total: number } | null>(null);

  useEffect(() => {
    if (activeTool === 'benchmarks') {
      fetchBenchmarks();
    }
  }, [benchmarkInsurer, activeTool]);

  const fetchBenchmarks = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'denials'), where('insurer', '==', benchmarkInsurer)));
      const docs = snapshot.docs.map((doc) => doc.data());
      const overturned = docs.filter((doc) => doc.status === 'overturned').length;
      setBenchmarkData({ success: overturned, total: docs.length });
    } catch (error) {
      console.error(error);
      setBenchmarkData({ success: 0, total: 0 });
    }
  };

  const benchmarkRate = benchmarkData ? Math.round((benchmarkData.success / (benchmarkData.total || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f4efe8] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 rounded-[2.7rem] bg-[#1d1714] px-8 py-10 text-white md:grid-cols-[1.05fr_0.95fr] md:px-12 md:py-14">
          <div className="space-y-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#efbfaa]">Fight back</p>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
              Take the denial letter and turn it into your next move.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/74">
              This page should feel like backup. Start with an appeal draft, compare similar cases, or keep track of what you’ve already sent.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'generator', label: 'Appeal generator', icon: Zap },
                { id: 'benchmarks', label: 'Benchmarks', icon: TrendingUp },
                { id: 'tracker', label: 'Tracker', icon: Clock },
              ].map((tool) => (
                <Button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as 'generator' | 'benchmarks' | 'tracker')}
                  className={`rounded-full ${
                    activeTool === tool.id ? 'bg-[#b43c2e] text-white hover:bg-[#9f3226]' : 'bg-white/8 text-white hover:bg-white/14'
                  }`}
                >
                  <tool.icon className="mr-2 h-4 w-4" />
                  {tool.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            {[
              { label: 'Recommended first step', value: 'Read the denial reason plainly' },
              { label: 'Best use of AI here', value: 'Draft structure + evidence language' },
              { label: 'Mindset', value: 'Calm, specific, and documented' },
            ].map((card) => (
              <div key={card.label} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/46">{card.label}</p>
                <p className="mt-3 text-lg font-semibold leading-snug">{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeTool === 'generator' && (
            <motion.section
              key="generator"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]"
            >
              <div className="rounded-[2.2rem] border border-black/8 bg-white/85 p-6 md:p-8">
                <AppealGenerator />
              </div>
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-black/8 bg-[#eadfce] p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#b43c2e]" />
                    <h2 className="text-2xl font-bold tracking-tight text-[#1f1b17]">Plain-language guardrails</h2>
                  </div>
                  <p className="mt-4 leading-relaxed text-[#574a40]">
                    Keep the appeal specific. Name the service, name the denial reason, and ask for the full case file if the insurer is being vague.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-black/8 bg-white/75 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a5a49]">Good workflow</p>
                  <div className="mt-5 space-y-3">
                    {[
                      'Upload the denial or paste the language',
                      'Confirm the insurer, treatment, and reason',
                      'Use the draft as a starting point, not the final word',
                      'Track your timeline and any response deadlines',
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3 rounded-[1.2rem] bg-[#f8f2ea] px-4 py-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f1b17] text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="pt-1 text-[#574a40]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeTool === 'benchmarks' && (
            <motion.section
              key="benchmarks"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4 rounded-[2.2rem] border border-black/8 bg-white/80 p-6 md:flex-row md:items-end md:justify-between md:p-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a5a49]">Benchmark view</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1f1b17]">Compare your insurer against the record.</h2>
                </div>
                <Select value={benchmarkInsurer} onValueChange={setBenchmarkInsurer}>
                  <SelectTrigger className="w-full rounded-full border-black/10 bg-[#f8f2ea] md:w-[280px]">
                    <SelectValue placeholder="Select insurer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UnitedHealthcare">UnitedHealthcare</SelectItem>
                    <SelectItem value="Aetna">Aetna</SelectItem>
                    <SelectItem value="Cigna">Cigna</SelectItem>
                    <SelectItem value="Blue Cross Blue Shield">Blue Cross Blue Shield</SelectItem>
                    <SelectItem value="Humana">Humana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { label: 'Observed overturn rate', value: `${benchmarkRate}%`, note: `${benchmarkData?.total || 0} tracked cases` },
                  { label: 'Best documented angle', value: 'Medical necessity', note: 'Most consistent appeal language' },
                  { label: 'Typical friction point', value: 'Paperwork + delay', note: 'Often mixed with prior auth confusion' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[2rem] border border-black/8 bg-[#1d1714] p-6 text-white">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/44">{item.label}</p>
                    <p className="mt-4 text-4xl font-bold tracking-tight">{item.value}</p>
                    <p className="mt-3 text-sm text-white/66">{item.note}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeTool === 'tracker' && (
            <motion.section
              key="tracker"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
            >
              <div className="rounded-[2.2rem] border border-black/8 bg-white/85 p-6 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a5a49]">Appeal tracker</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1f1b17]">A calmer place to keep the process straight.</h2>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between rounded-[1.4rem] border border-black/8 bg-[#f8f2ea] p-5">
                    <div>
                      <p className="text-lg font-bold text-[#1f1b17]">MRI Lumbar Spine</p>
                      <p className="text-sm text-[#7a6859]">Aetna • submitted 12 days ago</p>
                    </div>
                    <span className="rounded-full bg-[#e8c481] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#5f420d]">
                      In progress
                    </span>
                  </div>
                  <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-white/55 p-5 text-[#7a6859]">
                    No other tracked appeals yet.
                  </div>
                </div>
              </div>

              <div className="rounded-[2.2rem] bg-[#eadfce] p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#b43c2e]" />
                  <h2 className="text-2xl font-bold tracking-tight text-[#1f1b17]">What patients actually need here</h2>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    'A simple deadline reminder',
                    'A clean timeline of what was submitted and when',
                    'Notes about who said what on calls',
                    'One-button export of the appeal packet',
                  ].map((item) => (
                    <div key={item} className="rounded-[1.25rem] bg-white/70 px-4 py-4 text-[#574a40]">
                      {item}
                    </div>
                  ))}
                </div>
                <Button className="mt-6 rounded-full bg-[#1f1b17] text-white hover:bg-[#2a231d]">
                  Prepare my appeal packet <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
