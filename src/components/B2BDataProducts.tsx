import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileBarChart2,
  FileText,
  SearchCheck,
  ShieldCheck,
  Table2,
} from 'lucide-react';

const decisionMoments = [
  'TPA or ASO renewal is coming up',
  'Employee complaints are rising',
  'The committee needs a documented oversight record',
  'A broker deck does not explain denials or appeals',
  'Counsel or finance is asking what the plan actually receives',
  'The administrator has delayed, narrowed, or refused a data request',
];

const publicContextRows = [
  {
    category: 'Outpatient medical',
    requests: '76,481',
    denials: '7,168',
    appeals: '520',
    overturned: '339',
  },
  {
    category: 'Prescription drug',
    requests: '105,266',
    denials: '46,091',
    appeals: '573',
    overturned: '283',
  },
];

const readinessInputs = [
  'ASO or TPA agreement',
  'Plan document and SPD',
  'Claims and appeals procedure',
  'Renewal deck and current reporting package',
  'Committee agenda, minutes, or fiduciary review materials',
  'Member complaint themes and escalation history',
  'Gag-clause attestation and data-access workflow',
  'Prior data requests and TPA responses',
];

const auditInputs = [
  {
    file: '835 remittance / adjudication extract',
    fields: 'claim and line IDs, dates, CPT/HCPCS/NDC/revenue codes, billed/allowed/paid amounts, member liability, CARC/RARC codes',
    why: 'Shows which claim lines were paid, denied, adjusted, or pushed back for more work.',
  },
  {
    file: 'Prior authorization log',
    fields: 'request ID, service category, provider, received date, decision date, approval/denial status, denial reason, delegated vendor',
    why: 'Shows where care was blocked before service and how long decisions took.',
  },
  {
    file: 'Appeals log',
    fields: 'denial ID, appeal date, appeal level, outcome, upheld/reversed/partially reversed status, time to decision',
    why: 'Shows how often the first no changed after review.',
  },
  {
    file: 'Decision dictionary and mappings',
    fields: 'administrator reason labels, CARC/RARC mappings, service groups, automation flags, delegated-review mappings',
    why: 'Prevents vague labels from hiding the reason a denial happened.',
  },
  {
    file: 'Monthly denominator file',
    fields: 'eligible lives, claim volume, PA volume, appeal volume, plan option, location or business unit if approved',
    why: 'Lets the committee compare rates instead of raw counts.',
  },
];

const deliverables = [
  {
    title: 'Data Request Letter',
    detail: 'The exact file request the employer sends to the administrator, with fields, format, privacy boundaries, and deadline.',
  },
  {
    title: 'Oversight Gap Table',
    detail: 'What the committee receives today, what is missing, who controls it, and why the gap matters for renewal.',
  },
  {
    title: 'Public Benchmark Scan',
    detail: 'Source-linked public records for the administrator, clearly labeled by market, year, measure, and known limits.',
  },
  {
    title: 'Plan Denial Scorecard',
    detail: 'Denial rate, appeal rate, overturn rate, delay, repeated member friction, and top denial reasons from plan files.',
  },
  {
    title: 'Missing Data Log',
    detail: 'Every refused, delayed, incomplete, or unusable field is preserved as an oversight finding.',
  },
  {
    title: 'Renewal Question Set',
    detail: 'A board-ready list of questions, evidence exhibits, and contract asks for the next vendor decision.',
  },
];

const sampleScorecard = [
  {
    metric: 'First-pass denial rate',
    result: '9.6% of claim lines',
    question: 'Which service categories are driving avoidable rework?',
  },
  {
    metric: 'Appeal rate',
    result: '8.4% of denied lines',
    question: 'Are employees giving up because the process is too hard to use?',
  },
  {
    metric: 'Appeal overturn rate',
    result: '68.7% of appealed lines',
    question: 'Why did these claims require an appeal before payment changed?',
  },
  {
    metric: 'Administrative denials',
    result: '61% of denied lines',
    question: 'Which denials are paperwork, coding, eligibility, or missing-info friction?',
  },
  {
    metric: 'Restored after appeal',
    result: '$468,000',
    question: 'What contract or workflow change would reduce this repeat cycle?',
  },
];

const products = [
  {
    name: 'Decision Readiness Review',
    timing: '2-4 weeks',
    bestFor: 'Renewal, benefits committee review, data-access dispute, or a rising complaint pattern before plan files arrive.',
    input: 'Employer materials: contracts, plan documents, reporting, committee record, complaint themes, and prior vendor responses.',
    output: 'Oversight gap table, public benchmark scan, data-rights issue list, TPA request letter, and renewal question set.',
  },
  {
    name: 'Plan Denial Audit',
    timing: '6-8 weeks after files arrive',
    bestFor: 'Employers ready to use de-identified claims, prior-authorization, and appeals extracts to test what happened in the plan.',
    input: 'TPA/insurer files: 835 extract, prior authorization log, appeals log, decision dictionary, mappings, and denominators.',
    output: 'Board packet, denial and appeal scorecard, delay analysis, service-category concentration, missing-data log, and contract asks.',
  },
  {
    name: 'Ongoing Denial Oversight',
    timing: 'Quarterly or renewal-cycle cadence',
    bestFor: 'Committees that want a repeatable evidence record instead of rebuilding the question set every renewal season.',
    input: 'Updated quarterly extracts, management responses, corrective actions, and any new public administrator disclosures.',
    output: 'Trend scorecard, unresolved-gap tracker, issue escalation list, and decision memo for the next committee meeting.',
  },
];

export default function B2BDataProducts() {
  return (
    <div className="min-h-screen bg-[#f7fbf9] px-5 py-10 text-[#172f35] md:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="border-y border-[#cfded9] bg-[#fbfdfb] px-6 py-10 md:px-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 border border-[#b9cec7] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">
                <ShieldCheck className="h-4 w-4" />
                Employer Plan Oversight
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-[#123139] md:text-6xl">
                Your TPA decides what gets paid. You need an independent record before the next plan decision.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[#4f6867]">
                We help self-funded employers turn claims, prior-authorization, and appeals data into a board-ready view of
                denial patterns, appeal outcomes, delay, missing disclosures, and renewal questions.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="h-12 rounded-md bg-[#123139] px-6 text-base font-semibold text-white hover:bg-[#0c242a]">
                  Request an employer briefing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('sample-deliverables')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-12 rounded-md border-[#b9cec7] bg-white px-6 text-base font-semibold text-[#123139] hover:bg-[#eef6f2]"
                >
                  See sample outputs
                </Button>
              </div>
            </div>

            <aside className="border border-[#b9cec7] bg-[#eef6f2] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">Use this when</p>
              <div className="mt-5 grid gap-3">
                {decisionMoments.map((moment) => (
                  <div key={moment} className="flex gap-3 border-b border-[#d4e4df] pb-3 last:border-b-0 last:pb-0">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22735e]" />
                    <span className="text-sm font-medium leading-6 text-[#274747]">{moment}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">Positioning</p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#123139]">Public data opens the question. Plan files answer it.</h2>
            <p className="leading-7 text-[#4f6867]">
              Public records can show what an administrator reports in Medicare, Marketplace, Medicaid, or state-regulated
              markets. They cannot show what happened inside a particular self-funded employer plan.
            </p>
            <p className="leading-7 text-[#4f6867]">
              That is why the sellable product is not a public-data PDF. The value is the decision record: what the employer
              can ask for, what the administrator produces, what is missing, and what the committee can use before renewal.
            </p>
          </div>

          <div className="border border-[#cfded9] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e0ebe7] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">Real public-data sample</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#123139]">Blue Cross MN 2025 prior authorization table</h3>
              </div>
              <a
                href="https://www.bluecrossmn.com/providers/medical-management/prior-authorization-and-appeals-data"
                className="text-sm font-semibold text-[#0f5e63] underline underline-offset-4"
              >
                Source
              </a>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d8e5e1] text-[11px] uppercase tracking-[0.18em] text-[#607975]">
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Requests</th>
                    <th className="py-3 pr-4">Denials</th>
                    <th className="py-3 pr-4">Appeals</th>
                    <th className="py-3">Overturned</th>
                  </tr>
                </thead>
                <tbody>
                  {publicContextRows.map((row) => (
                    <tr key={row.category} className="border-b border-[#edf3f1]">
                      <td className="py-4 pr-4 font-semibold text-[#123139]">{row.category}</td>
                      <td className="py-4 pr-4 text-[#4f6867]">{row.requests}</td>
                      <td className="py-4 pr-4 text-[#4f6867]">{row.denials}</td>
                      <td className="py-4 pr-4 text-[#4f6867]">{row.appeals}</td>
                      <td className="py-4 text-[#4f6867]">{row.overturned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 border-l-4 border-[#0f5e63] bg-[#f4faf7] p-4 text-sm leading-6 text-[#4f6867]">
              <strong className="text-[#123139]">How we use this:</strong> not as proof of your plan, but as a concrete example
              of the fields a committee can request from its own administrator: requests, denials, appeals, overturns, service
              category, submission method, and denial reasons.
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.name} className="border border-[#cfded9] bg-white p-6">
              <div className="flex items-start gap-3">
                <FileBarChart2 className="mt-1 h-5 w-5 shrink-0 text-[#0f5e63]" />
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#123139]">{product.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-[#607975]">{product.timing}</p>
                </div>
              </div>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">Best when</dt>
                  <dd className="mt-2 text-sm leading-6 text-[#4f6867]">{product.bestFor}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">What you send us</dt>
                  <dd className="mt-2 text-sm leading-6 text-[#4f6867]">{product.input}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#42635d]">What we deliver</dt>
                  <dd className="mt-2 text-sm leading-6 text-[#4f6867]">{product.output}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border border-[#cfded9] bg-[#123139] p-6 text-white">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-[#a6d8c7]" />
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">Decision Readiness Review inputs</h2>
            </div>
            <p className="mt-4 leading-7 text-[#d5e8e3]">
              This is the starting point when the committee needs a credible request and oversight record before the TPA has
              delivered claim-level extracts.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {readinessInputs.map((input) => (
                <div key={input} className="border border-white/15 bg-white/5 p-3 text-sm leading-6 text-[#ecf6f2]">
                  {input}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#cfded9] bg-white p-6">
            <div className="flex items-center gap-3">
              <SearchCheck className="h-5 w-5 text-[#0f5e63]" />
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#123139]">Plan Denial Audit files</h2>
            </div>
            <p className="mt-4 leading-7 text-[#4f6867]">
              These are the core files the employer asks the insurer or TPA to produce. The standard audit uses de-identified
              records and aggregate reporting.
            </p>
            <div className="mt-6 space-y-4">
              {auditInputs.map((input) => (
                <div key={input.file} className="border-l-4 border-[#b9cec7] bg-[#f7fbf9] p-4">
                  <h3 className="font-semibold text-[#123139]">{input.file}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4f6867]">
                    <strong>Minimum fields:</strong> {input.fields}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4f6867]">
                    <strong>Why it matters:</strong> {input.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sample-deliverables" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">Example deliverables</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#123139]">What the committee can actually use.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#607975]">
              The sample figures below are demo data. The report structure is the product: a decision packet that separates
              facts, gaps, questions, and contract asks.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((item) => (
              <article key={item.title} className="border border-[#cfded9] bg-white p-5">
                <FileText className="h-5 w-5 text-[#0f5e63]" />
                <h3 className="mt-4 text-xl font-semibold text-[#123139]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#4f6867]">{item.detail}</p>
              </article>
            ))}
          </div>

          <figure className="border border-[#9eb8b0] bg-white p-5">
            <figcaption className="flex flex-wrap justify-between gap-3 border-b border-[#d8e5e1] pb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#42635d]">Sample board packet</span>
              <strong className="text-[11px] uppercase tracking-[0.2em] text-[#9b4639]">Demo data - no real people or plan</strong>
            </figcaption>
            <div className="mt-5 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="bg-[#f4faf7] p-5">
                <Table2 className="h-6 w-6 text-[#0f5e63]" />
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#123139]">
                  Public data tells you what questions to ask. Your plan files tell you what happened.
                </h3>
                <p className="mt-4 text-sm leading-6 text-[#4f6867]">
                  The report does not assume a denial was wrongful. It shows where the first answer changed, where records are
                  missing, and which service-provider questions belong in the renewal file.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d8e5e1] text-[11px] uppercase tracking-[0.18em] text-[#607975]">
                      <th className="py-3 pr-4">Metric</th>
                      <th className="py-3 pr-4">Sample result</th>
                      <th className="py-3">Committee question</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleScorecard.map((row) => (
                      <tr key={row.metric} className="border-b border-[#edf3f1]">
                        <td className="py-4 pr-4 font-semibold text-[#123139]">{row.metric}</td>
                        <td className="py-4 pr-4 text-[#4f6867]">{row.result}</td>
                        <td className="py-4 text-[#4f6867]">{row.question}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </figure>
        </section>

        <section className="grid gap-6 border-y border-[#cfded9] bg-[#eef6f2] p-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#9b4639]" />
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#123139]">The boundary is part of the value.</h2>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-7 text-[#4f6867]">
            <p>
              We do not ask for member names, member IDs, diagnosis narratives, denial notices, or medical records in the
              initial employer briefing. The plan audit is built from de-identified administrative extracts.
            </p>
            <p>
              If the administrator refuses or cannot produce a file, we do not guess. We record that refusal or gap as a
              governance finding and translate it into a decision question.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
