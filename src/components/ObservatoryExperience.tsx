import React from 'react';
import { ArrowRight, BarChart3, Building2, FileText, Search, Share2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DenialRecord } from '@/src/types';
import { getPhaseSuccessCriteria, trackEvent } from '@/src/lib/analytics';

type ObservatoryExperienceProps = {
  featuredStories: DenialRecord[];
  totalStories: number;
  topCategory: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onNavigate: (tab: 'share' | 'appeal' | 'insights' | 'b2b') => void;
  onFindPatternFromQuery: (presetLabel?: string) => void;
  onStartStoryFromQuery: () => void;
};

const SEARCH_CHIPS = ['UnitedHealthcare', 'Blue Cross Blue Shield', 'GLP-1 medication', 'MRI', 'Prior Authorization'];

export default function ObservatoryExperience({
  featuredStories,
  searchTerm,
  onSearchTermChange,
  onNavigate,
  onFindPatternFromQuery,
  onStartStoryFromQuery,
}: ObservatoryExperienceProps) {
  const phaseCriteria = getPhaseSuccessCriteria();

  const openAppeal = () => {
    trackEvent('patient_appeal_cta_click', { audience: 'patient', source: 'homepage' });
    onNavigate('appeal');
  };

  const openLookup = (label?: string) => {
    trackEvent('patient_pattern_lookup_click', { audience: 'patient', source: 'homepage' });
    onFindPatternFromQuery(label);
  };

  const openStory = () => {
    trackEvent('patient_story_share_click', { audience: 'patient', source: 'homepage' });
    onStartStoryFromQuery();
  };

  const openEmployer = () => {
    trackEvent('employer_tpa_visibility_check_click', { audience: 'employer', source: 'homepage' });
    onNavigate('b2b');
  };

  return (
    <div className="min-h-screen bg-[#f7fbf9] text-[#143047]">
      <section className="border-b border-[#d5e3df]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="max-w-5xl space-y-5">
            <div className="inline-flex items-center gap-2 border border-[#b9cec7] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">
              Health insurance denial help
            </div>
            <h1 className="text-5xl tracking-[-0.06em] text-[#102f36] md:text-7xl">
              Two ways to use FightInsuranceDenials.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[#4f6867] md:text-xl">
              Free tools for patients fighting a denial. Independent denial visibility for self-funded employers preparing
              for renewal, committee review, or TPA oversight.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="border border-[#cfded9] bg-white p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#123139] text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">
                    For Patients
                  </p>
                  <h2 className="mt-3 text-4xl tracking-[-0.05em] text-[#102f36]">
                    Insurance denied your care? Start here.
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-base leading-7 text-[#4f6867]">
                Generate an appeal letter, search denial patterns, and decide whether to share an anonymized story. The
                patient tools are self-serve and free.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button onClick={openAppeal} className="h-13 rounded-md bg-[#123139] px-6 text-white hover:bg-[#0c242a]">
                  Write My Appeal Letter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openLookup()}
                  className="h-13 rounded-md border-[#b9cec7] bg-white px-6 text-[#123139] hover:bg-[#eef6f2]"
                >
                  Search Real Denials
                </Button>
              </div>

              <div className="mt-7 border border-[#d5e3df] bg-[#f7fbf9] p-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">
                  Search denial patterns
                </label>
                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f8581]" />
                    <input
                      value={searchTerm}
                      onChange={(event) => onSearchTermChange(event.target.value)}
                      placeholder='Try "GLP-1 denied in California" or "MRI prior auth denied"'
                      className="h-13 w-full border border-[#cfded9] bg-white pl-12 pr-4 text-[15px] text-[#123139] outline-none"
                    />
                  </div>
                  <Button onClick={() => openLookup()} className="h-13 rounded-md bg-[#0f5e63] px-5 text-white hover:bg-[#0a4d51]">
                    Search <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SEARCH_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        onSearchTermChange(chip);
                        openLookup(chip);
                      }}
                      className="border border-[#cfded9] bg-white px-3 py-2 text-xs font-semibold text-[#275c5c] transition-colors hover:bg-[#eef6f2]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="border border-[#123139] bg-[#123139] p-6 text-white md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-white text-[#123139]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a6d8c7]">
                    Employer validation · For Self-Funded Employers
                  </p>
                  <h2 className="mt-3 text-4xl tracking-[-0.05em] text-white">
                    Renewing a TPA contract without denial visibility?
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-base leading-7 text-[#d5e8e3]">
                Get a clearer view of what denial, appeal, and prior-authorization data your committee should ask for before
                the next plan decision.
              </p>
              <div className="mt-6 grid gap-3">
                {[
                  'TPA or ASO renewal coming up',
                  'Employee complaints are rising',
                  'Broker reports do not explain denials, appeals, or overturns',
                  'Counsel or finance wants an oversight record',
                ].map((item) => (
                  <div key={item} className="flex gap-3 border border-white/15 bg-white/5 p-3 text-sm leading-6 text-[#ecf6f2]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#a6d8c7]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button onClick={openEmployer} className="h-13 rounded-md bg-white px-6 text-[#123139] hover:bg-[#ecf6f2]">
                  Request a TPA Visibility Check
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    trackEvent('employer_sample_report_click', { audience: 'employer', source: 'homepage' });
                    onNavigate('b2b');
                  }}
                  className="h-13 rounded-md border-white/25 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  Download Sample Oversight Report
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <button
            type="button"
            onClick={openAppeal}
            className="border border-[#cfded9] bg-white p-6 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">Free patient tools</p>
            <h2 className="mt-3 text-2xl tracking-[-0.04em] text-[#102f36]">Write My Appeal Letter</h2>
            <p className="mt-3 text-sm leading-7 text-[#4f6867]">
              Read a denial letter locally, pull out the key facts, and draft an appeal without storing the raw letter.
            </p>
          </button>
          <button
            type="button"
            onClick={() => openLookup()}
            className="border border-[#cfded9] bg-white p-6 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">Public lookup</p>
            <h2 className="mt-3 text-2xl tracking-[-0.04em] text-[#102f36]">Search Real Denials</h2>
            <p className="mt-3 text-sm leading-7 text-[#4f6867]">
              Search publicly shared stories by insurer, state, denial reason, and care type. This is public context, not a
              private-plan audit.
            </p>
          </button>
          <button
            type="button"
            onClick={openStory}
            className="border border-[#cfded9] bg-white p-6 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">Public record</p>
            <h2 className="mt-3 text-2xl tracking-[-0.04em] text-[#102f36]">Share My Story</h2>
            <p className="mt-3 text-sm leading-7 text-[#4f6867]">
              Share structured details only if you choose. Public stories are reviewed and anonymized before publishing.
            </p>
          </button>
        </div>

        <div className="mt-10 border border-[#cfded9] bg-white p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#0f5e63]" />
            <h2 className="text-3xl tracking-[-0.04em] text-[#102f36]">Success criteria for the pivot</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {phaseCriteria.map((criterion) => (
              <article key={criterion.phase} className="border border-[#d5e3df] bg-[#f7fbf9] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#42635d]">{criterion.phase}</p>
                <p className="mt-3 text-sm leading-6 text-[#4f6867]">{criterion.goal}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#123139]">{criterion.successMetric}</p>
              </article>
            ))}
          </div>
        </div>

        {featuredStories.length ? (
          <div className="mt-10 border border-[#cfded9] bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">
                  Real denials patients already shared
                </p>
                <h2 className="mt-3 text-3xl tracking-[-0.04em] text-[#102f36]">Start with a real example.</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {featuredStories.slice(0, 3).map((story) => (
                <article key={story.id} className="border border-[#d5e3df] bg-[#f7fbf9] p-5">
                  <h3 className="text-xl text-[#102f36]">{story.title || `${story.procedure} denied by ${story.insurer}`}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#4f6867]">{story.summary || story.narrative}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const label = `${story.insurer || ''} ${story.procedure || ''}`.trim();
                      onSearchTermChange(label);
                      openLookup(label);
                    }}
                    className="mt-4 text-sm font-semibold text-[#0f5e63]"
                  >
                    Search similar denials
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
