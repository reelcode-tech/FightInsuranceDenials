export type AnalyticsEventName =
  | 'page_view'
  | 'patient_appeal_cta_click'
  | 'patient_pattern_lookup_click'
  | 'patient_story_share_click'
  | 'employer_tpa_visibility_check_click'
  | 'employer_sample_report_click'
  | 'employer_pilot_interest_click'
  | 'lookup_state_filter_click'
  | 'lookup_search_started'
  | 'phase_success_view';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const SAFE_PROPERTY_KEYS = new Set([
  'audience',
  'source',
  'path',
  'role',
  'companySize',
  'currentTpa',
  'renewalWindow',
  'state',
  'insurer',
  'category',
  'phase',
]);

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties: Record<string, string | number | boolean | null>;
  timestamp: string;
};

export type PhaseSuccessCriterion = {
  phase: string;
  goal: string;
  successMetric: string;
  stopOrContinueRule: string;
};

export function buildAnalyticsEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}): AnalyticsEvent {
  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => SAFE_PROPERTY_KEYS.has(key) && value !== undefined),
  ) as Record<string, string | number | boolean | null>;

  return {
    name,
    properties: safeProperties,
    timestamp: new Date().toISOString(),
  };
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window === 'undefined') return;

  const event = buildAnalyticsEvent(name, {
    path: window.location.pathname,
    ...properties,
  });

  window.dispatchEvent(new CustomEvent('fid:analytics', { detail: event }));

  const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({
      event: event.name,
      ...event.properties,
    });
  }

  const viteEnv = (import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env;
  if (viteEnv?.DEV) {
    console.info('[FID analytics]', event);
  }
}

export function initAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const measurementId = viteEnv?.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  const existingScript = document.querySelector(`script[data-fid-ga="${measurementId}"]`);
  if (existingScript) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.setAttribute('data-fid-ga', measurementId);
  document.head.appendChild(script);

  const win = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  win.dataLayer = win.dataLayer || [];
  win.gtag = (...args: unknown[]) => {
    win.dataLayer?.push(args);
  };
  win.gtag('js', new Date());
  win.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });
}

export function getPhaseSuccessCriteria(): PhaseSuccessCriterion[] {
  return [
    {
      phase: 'Phase 1: Lean Landing Page Conversion',
      goal: 'Test whether the redesigned site conversion paths get the right audiences to self-select and raise their hand.',
      successMetric:
        'At least 10 TPA Visibility Check clicks, 5 sample report clicks, or 3 qualified employer form submissions in 30 days.',
      stopOrContinueRule:
        'If employer CTAs get no qualified engagement after meaningful traffic, revise the employer problem statement before building ingestion.',
    },
    {
      phase: 'Phase 2: Discovery and Pilot Validation',
      goal: 'Validate that employers have a painful denial-visibility gap and can request useful data from their TPA or ASO.',
      successMetric:
        'Complete 12 employer/advisor interviews, get 3 employers to review the data request, and secure 1 pilot willing to provide de-identified extracts.',
      stopOrContinueRule:
        'If employers cannot access denial, prior-authorization, or appeals data, pivot to readiness reviews and data-rights advisory only.',
    },
    {
      phase: 'Phase 3: Product Build Strategy',
      goal: 'Build ingestion only after the buyer pain and plan-data access are validated.',
      successMetric:
        'One real plan-data pilot produces a reusable board packet from 835/remittance data, prior authorization logs, appeals logs, and a denominator file.',
      stopOrContinueRule:
        'If the first pilot requires mostly bespoke manual cleanup, keep the product as a service-led audit until repeatable mappings emerge.',
    },
  ];
}
