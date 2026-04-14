export type AppTab = 'home' | 'share' | 'appeal' | 'insights' | 'b2b' | 'about';

export const TAB_PATHS: Record<AppTab, string> = {
  home: '/',
  share: '/share-your-story',
  appeal: '/fight-back',
  insights: '/evidence-patterns',
  b2b: '/data-products',
  about: '/about-trust',
};

export function getTabFromPath(pathname: string): AppTab {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return (Object.entries(TAB_PATHS).find(([, path]) => path === normalized)?.[0] || 'home') as AppTab;
}
