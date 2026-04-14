import React from 'react';
import { ArrowRight, Scale, ShieldCheck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppealGenerator from './AppealGenerator';
import { APPEAL_SUCCESS_TIPS } from '@/src/lib/appealGuidance';

export default function AppealTools() {
  return (
    <div className="min-h-screen bg-[#070b16] px-5 py-10 text-[#f5f7ff] md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="rounded-[2.8rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(138,92,246,0.18),transparent_28%),linear-gradient(180deg,#091024_0%,#070b16_100%)] px-8 py-12 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:px-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bfb8ef]">
                <Scale className="h-3.5 w-3.5" />
                Fight back
              </div>
              <h1 className="text-5xl font-semibold tracking-[-0.07em] text-white md:text-6xl">
                Your denial just got a lawyer.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#c0c8e6]">
                Upload the letter. Our AI turns it into a smarter appeal using real plan language, repeat patterns, and the strongest arguments that actually work.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="h-14 rounded-[1rem] bg-[#8b5cf6] px-8 text-base font-semibold text-white shadow-[0_18px_45px_rgba(139,92,246,0.28)] hover:bg-[#7b49ec]">
                  Upload denial letter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'insights' }))}
                  className="h-14 rounded-[1rem] border-white/10 bg-white/6 px-8 text-base font-semibold text-white hover:bg-white/10"
                >
                  Or search real denial stories
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-[#0d1224] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bfb8ef]">What actually wins appeals</p>
              <div className="mt-5 space-y-4">
                {[
                  'Force the insurer to name the exact rule they used.',
                  'Answer their denial reason with evidence, not emotion.',
                  'Keep a documented timeline so delays and contradictions become part of the case.',
                ].map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1638] text-sm font-semibold text-[#d0b4ff]">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-[#d8def7]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2.3rem] border border-white/8 bg-[#0d1224] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8">
            <AppealGenerator />
          </div>

          <div className="rounded-[2.3rem] border border-white/8 bg-[#0d1224] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#8ea9ff]" />
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">6 moves that actually win appeals</h2>
            </div>
            <div className="mt-6 space-y-4">
              {APPEAL_SUCCESS_TIPS.map((tip, index) => (
                <article key={tip.title} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f1638] text-sm font-semibold text-[#d0b4ff]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{tip.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#d8def7]">{tip.detail}</p>
                      <p className="mt-2 text-sm leading-7 text-[#aeb7d7]">{tip.whyItWorks}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.4rem] border border-white/8 bg-[#0b1020] p-8 text-center md:p-12">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bfb8ef]">
              <Wand2 className="h-3.5 w-3.5" />
              Appeal support
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
              Stop writing angry letters. Start using the insurer's own rules against them.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#c0c8e6]">
              Bring the denial. We'll help you pull out the fields that matter, connect them to repeat patterns, and start a smarter appeal.
            </p>
            <Button className="mt-8 h-14 rounded-[1rem] bg-[#8b5cf6] px-8 text-base font-semibold text-white hover:bg-[#7b49ec]">
              Ready to strike back? Start AI appeal generation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
