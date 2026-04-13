import React from 'react';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppealGenerator from './AppealGenerator';
import { APPEAL_SUCCESS_TIPS } from '@/src/lib/appealGuidance';

export default function AppealTools() {
  return (
    <div className="min-h-screen bg-[#060814] px-5 py-10 text-[#f4f3ff] md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="rounded-[2.7rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_28%),linear-gradient(180deg,#0a1023_0%,#090d1d_100%)] px-8 py-12 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:px-12 md:py-16">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bcb7ea]">
              Fight back
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.07em] text-white md:text-6xl">
              Turn the denial letter into your next move.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#bcb7d8]">
              Upload the denial, confirm what matters, and generate a smarter appeal that uses plan language, repeat patterns, and the strongest arguments we can pull from the database.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="h-14 rounded-[1rem] bg-[#8b5cf6] px-8 text-base font-semibold text-white hover:bg-[#7b49ec]">
                Write your AI appeal
              </Button>
              <Button
                variant="outline"
                onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'insights' }))}
                className="h-14 rounded-[1rem] border-white/10 bg-white/6 px-8 text-base font-semibold text-white hover:bg-white/10"
              >
                Search the denial database
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[2.4rem] border border-white/8 bg-[#0d1224] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8">
            <AppealGenerator />
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/8 bg-[#0d1224] p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#8ea9ff]" />
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">What actually helps an appeal</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#bcb7d8]">
                Strong appeals are usually specific, documented, and aimed at the insurer's actual rationale instead of generic frustration. These are the repeat moves that show up across official guides and advocacy playbooks.
              </p>
            </div>

            <div className="space-y-4">
              {APPEAL_SUCCESS_TIPS.map((tip, index) => (
                <article key={tip.title} className="rounded-[1.8rem] border border-white/8 bg-[#0d1224] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18112a] text-sm font-semibold text-[#d4c4ff]">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">{tip.title}</h3>
                      <p className="text-sm leading-7 text-[#d3cfe8]">{tip.detail}</p>
                      <p className="text-sm leading-7 text-[#9fa7c8]">{tip.whyItWorks}</p>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {tip.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-[#d4c4ff] hover:bg-white/10"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Name the rule they used',
              body: 'The fastest way to weaken a denial is to force the insurer to identify the exact policy, guideline, or clinical criteria they relied on.',
            },
            {
              title: 'Bring the evidence back to their reason',
              body: 'A good appeal does not just say the treatment matters. It answers the specific reason they gave for refusing it.',
            },
            {
              title: 'Build a paper trail',
              body: 'Deadlines, call logs, representative names, denial quotes, and doctor letters all become leverage once the insurer starts delaying or shifting its rationale.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8ea9ff]">Success tip</p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#bcb7d8]">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2.4rem] border border-white/8 bg-[#0b1020] p-8 text-center md:p-12">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bcb7ea]">
              <Sparkles className="h-3.5 w-3.5" />
              Appeal support
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Ready to strike back?</h2>
            <p className="mt-4 text-base leading-7 text-[#bcb7d8]">
              Bring the denial letter. We will help you pull out the meaningful fields, connect them to precedent, and start an appeal draft that is actually aimed at the denial you got.
            </p>
            <Button className="mt-8 h-14 rounded-[1rem] bg-[#8b5cf6] px-8 text-base font-semibold text-white hover:bg-[#7b49ec]">
              Start AI appeal generation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
