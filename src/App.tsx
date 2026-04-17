import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import SubmitDenial from './components/SubmitDenial';
import Insights from './components/Insights';
import DataVisualizations from './components/DataVisualizations';
import AppealTools from './components/AppealTools';
import B2BDataProducts from './components/B2BDataProducts';
import AboutTransparency from './components/AboutTransparency';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Menu, ShieldAlert, X } from 'lucide-react';
import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { toast } from 'sonner';
import { AppTab, getTabFromPath, TAB_PATHS } from './lib/siteRoutes';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => getTabFromPath(window.location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const navigateToTab = React.useCallback((tab: AppTab) => {
    const nextPath = TAB_PATHS[tab];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ tab }, '', nextPath);
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleNav = (event: Event) => {
      const detail = (event as CustomEvent<AppTab>).detail;
      if (detail) navigateToTab(detail);
    };

    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('nav', handleNav);
    window.addEventListener('popstate', handlePopState);
    return () => {
      unsubscribe();
      window.removeEventListener('nav', handleNav);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigateToTab]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Signed out');
  };

  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'appeal', label: 'Fight Back' },
    { id: 'insights', label: 'Evidence Patterns' },
    { id: 'visuals', label: 'Data Visualizations' },
    { id: 'b2b', label: 'Data Products' },
    { id: 'about', label: 'About Trust' },
  ];

  const footerGroups: Array<{ title: string; items: Array<{ label: string; tab: AppTab }> }> = [
    {
      title: 'Explore',
      items: [
        { label: 'Home', tab: 'home' },
        { label: 'Fight Back', tab: 'appeal' },
        { label: 'Evidence Patterns', tab: 'insights' },
        { label: 'Data Visualizations', tab: 'visuals' },
        { label: 'Data Products', tab: 'b2b' },
      ],
    },
    {
      title: 'Contribute',
      items: [
        { label: 'Share Your Story', tab: 'share' },
      ],
    },
    {
      title: 'Trust',
      items: [{ label: 'About Trust', tab: 'about' }],
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'share':
        return <SubmitDenial />;
      case 'appeal':
        return <AppealTools />;
      case 'insights':
        return <Insights />;
      case 'visuals':
        return <DataVisualizations />;
      case 'b2b':
        return <B2BDataProducts />;
      case 'about':
        return <AboutTransparency />;
      case 'home':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fcfd_0%,#eef8fb_100%)] text-[#12324a]">
      <header className="sticky top-0 z-50 border-b border-[#d7e7eb] bg-[rgba(248,252,253,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button className="flex items-center gap-3 text-left" onClick={() => navigateToTab('home')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1174a6,#49c1ab)] text-white shadow-[0_14px_32px_rgba(43,136,166,0.22)]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[#12324a]">FightInsuranceDenials</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#628393]">
                Health insurance denial database
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#0f5ea8] text-white shadow-[0_10px_26px_rgba(15,94,168,0.18)]'
                    : 'text-[#456476] hover:bg-[#ebf6f8]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <div className="rounded-full border border-[#d6e7ed] bg-white px-4 py-2 text-sm text-[#456476]">
                  {user.displayName || user.email}
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-[#d6e7ed] bg-white text-[#12324a] hover:bg-[#f4fbfd]"
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="rounded-full bg-[#0f5ea8] px-5 text-white hover:bg-[#0c4f8f]"
              >
                Sign in
              </Button>
            )}
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d6e7ed] bg-white lg:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-[#d7e7eb] bg-[#f8fcfd] px-5 pb-5 pt-3 lg:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateToTab(item.id);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                    activeTab === item.id ? 'bg-[#0f5ea8] text-white' : 'bg-white text-[#456476]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {!user ? (
                <Button onClick={handleLogin} className="mt-3 rounded-2xl bg-[#0f5ea8] text-white hover:bg-[#0c4f8f]">
                  Sign in
                </Button>
              ) : (
                <Button onClick={handleLogout} variant="outline" className="mt-3 rounded-2xl border-[#d6e7ed] bg-white text-[#12324a]">
                  Sign out
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{renderActiveTab()}</main>
      <footer className="border-t border-[#d7e7eb] bg-[linear-gradient(180deg,#f3fbfd_0%,#ebf5f8_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.2fr_1fr] md:px-8">
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#628393]">
              Public health insurance denial database
            </p>
            <h2 className="max-w-xl text-3xl tracking-[-0.05em] text-[#12324a]">
              Built so patients do not have to fight a denial in isolation.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#5f7c8c]">
              Search the record, compare your denial, share your story, and build a stronger appeal with evidence that is bigger
              than one phone call or one letter.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#628393]">{group.title}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigateToTab(item.tab)}
                      className="text-left text-sm font-medium text-[#456476] transition-colors hover:text-[#0f5ea8]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
      <Toaster position="top-right" richColors theme="light" />
    </div>
  );
}
