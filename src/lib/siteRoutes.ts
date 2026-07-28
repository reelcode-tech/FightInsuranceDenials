import { VISUAL_FILTERS_KEY } from '@/src/lib/appealLeverage';

export type AppTab = 'home' | 'share' | 'appeal' | 'insights' | 'visuals' | 'b2b' | 'about';

export type VisualFilterSeed = {
  quickFilterLabel?: string;
  insurer?: string;
  reason?: string;
  procedure?: string;
  state?: string;
  createdAt: string;
};

export const TAB_PATHS: Record<AppTab, string> = {
  home: '/',
  share: '/share-your-story',
  appeal: '/write-my-appeal-letter',
  insights: '/what-other-patients-are-seeing-right-now',
  visuals: '/what-other-patients-are-seeing-right-now',
  b2b: '/employers',
  about: '/about',
};

const LEGACY_TAB_PATHS: Record<string, AppTab> = {
  '/fight-back': 'appeal',
  '/what-other-patients-are-seeing-right-now': 'insights',
  '/evidence-and-insights': 'insights',
  '/evidence-insights': 'insights',
  '/evidence-patterns': 'insights',
  '/data-visualizations': 'visuals',
  '/data-products': 'b2b',
  '/about-trust': 'about',
};

export function seedVisualFilters(seed: Omit<VisualFilterSeed, 'createdAt'>) {
  if (typeof window === 'undefined') return;

  const payload: VisualFilterSeed = {
    ...seed,
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(VISUAL_FILTERS_KEY, JSON.stringify(payload));
}

export function getTabFromPath(pathname: string): AppTab {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const directMatch = Object.entries(TAB_PATHS).find(([, path]) => path === normalized)?.[0];
  return (directMatch || LEGACY_TAB_PATHS[normalized] || 'home') as AppTab;
}

export function getCanonicalPathForPath(pathname: string) {
  const tab = getTabFromPath(pathname);
  return TAB_PATHS[tab];
}
