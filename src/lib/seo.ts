import type { AppTab } from '@/src/lib/siteRoutes';
import { TAB_PATHS } from '@/src/lib/siteRoutes';

type PageSeo = {
  title: string;
  description: string;
  headline: string;
};

const SITE_ORIGIN = 'https://www.fightinsurancedenials.com';
const UPDATED_AT = '2026-04-20';

const PAGE_SEO: Record<AppTab, PageSeo> = {
  home: {
    title: 'Your Insurance Said No. We Help You Fight Back.',
    description:
      'Write a stronger appeal letter, search real insurance denials, and share your story so patients can turn denial chaos into public proof.',
    headline: 'Your Insurance Said No. We Help You Fight Back.',
  },
  appeal: {
    title: 'Write My Appeal Letter',
    description:
      'Upload a denial letter, photo, or PDF and generate a stronger insurance appeal letter using similar real denials from the public database.',
    headline: 'Write My Appeal Letter',
  },
  insights: {
    title: 'What Other Patients Are Seeing Right Now',
    description:
      'Search real insurance denials, see what excuse insurers keep using, and copy ready-to-use language into your appeal letter.',
    headline: 'What Other Patients Are Seeing Right Now',
  },
  visuals: {
    title: 'What Other Patients Are Seeing Right Now',
    description:
      'Search real insurance denials, see what excuse insurers keep using, and copy ready-to-use language into your appeal letter.',
    headline: 'What Other Patients Are Seeing Right Now',
  },
  share: {
    title: 'Share Your Story',
    description:
      'Add your insurance denial to the public record so other patients can compare it, search it, and use it in their own appeal.',
    headline: 'Share what happened. Help the record grow.',
  },
  b2b: {
    title: 'Employer Plan Oversight',
    description:
      'Independent denial-data review for self-funded employers preparing for renewal, committee review, TPA escalation, or plan-data requests.',
    headline: 'Your TPA decides what gets paid. You need an independent record before the next plan decision.',
  },
  about: {
    title: 'About FightInsuranceDenials',
    description:
      'Learn how FightInsuranceDenials collects stories, protects privacy, and turns repeat insurance denials into a searchable public record.',
    headline: 'A public-interest database for people who got cornered by the system.',
  },
};

function ensureMeta(selector: string, factory: () => HTMLMetaElement | HTMLLinkElement | HTMLScriptElement) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | HTMLScriptElement | null;
  if (!element) {
    element = factory();
    document.head.appendChild(element);
  }
  return element;
}

export function applyPageSeo(tab: AppTab) {
  if (typeof document === 'undefined') return;

  const page = PAGE_SEO[tab];
  const path = TAB_PATHS[tab];
  const canonicalUrl = `${SITE_ORIGIN}${path}`;
  const title = `${page.title} | FightInsuranceDenials`;

  document.title = title;

  const description = ensureMeta('meta[name="description"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    return meta;
  }) as HTMLMetaElement;
  description.content = page.description;

  const robots = ensureMeta('meta[name="robots"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    return meta;
  }) as HTMLMetaElement;
  robots.content = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

  const canonical = ensureMeta('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    return link;
  }) as HTMLLinkElement;
  canonical.href = canonicalUrl;

  const ogTitle = ensureMeta('meta[property="og:title"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:title');
    return meta;
  }) as HTMLMetaElement;
  ogTitle.content = title;

  const ogDescription = ensureMeta('meta[property="og:description"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:description');
    return meta;
  }) as HTMLMetaElement;
  ogDescription.content = page.description;

  const ogUrl = ensureMeta('meta[property="og:url"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:url');
    return meta;
  }) as HTMLMetaElement;
  ogUrl.content = canonicalUrl;

  const twitterTitle = ensureMeta('meta[name="twitter:title"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'twitter:title');
    return meta;
  }) as HTMLMetaElement;
  twitterTitle.content = title;

  const twitterDescription = ensureMeta('meta[name="twitter:description"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'twitter:description');
    return meta;
  }) as HTMLMetaElement;
  twitterDescription.content = page.description;

  const schema = ensureMeta('script[data-seo-schema="page"]', () => {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo-schema', 'page');
    return script;
  }) as HTMLScriptElement;

  schema.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': tab === 'home' ? 'WebSite' : 'WebPage',
    name: page.title,
    headline: page.headline,
    description: page.description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    dateModified: UPDATED_AT,
    publisher: {
      '@type': 'Organization',
      name: 'FightInsuranceDenials',
      url: SITE_ORIGIN,
    },
  });
}
