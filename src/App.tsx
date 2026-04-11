import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import SubmitDenial from './components/SubmitDenial';
import Insights from './components/Insights';
import AppealTools from './components/AppealTools';
import B2BDataProducts from './components/B2BDataProducts';
import AboutTransparency from './components/AboutTransparency';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Menu, ShieldAlert, X } from 'lucide-react';
import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { toast } from 'sonner';

type AppTab = 'home' | 'share' | 'appeal' | 'insights' | 'b2b' | 'about';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleNav = (event: Event) => {
      const detail = (event as CustomEvent<AppTab>).detail;
      if (detail) setActiveTab(detail);
    };

    window.addEventListener('nav', handleNav);
    return () => {
      unsubscribe();
      window.removeEventListener('nav', handleNav);
    };
  }, []);

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
    { id: 'home', label: 'Observatory' },
    { id: 'share', label: 'Share Your Story' },
    { id: 'appeal', label: 'Fight Back' },
    { id: 'insights', label: 'Evidence Patterns' },
    { id: 'b2b', label: 'Data Products' },
    { id: 'about', label: 'About / Trust' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'share':
        return <SubmitDenial />;
      case 'appeal':
        return <AppealTools />;
      case 'insights':
        return <Insights />;
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
    <div className="min-h-screen bg-[#f4efe8] text-[#1f1b17]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f4efe8]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button className="flex items-center gap-3 text-left" onClick={() => setActiveTab('home')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b43c2e] text-white shadow-[0_14px_40px_rgba(180,60,46,0.22)]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[#201915]">FightInsuranceDenials</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8b7d70]">
                Public observatory + patient action
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#1f1b17] text-white'
                    : 'text-[#574a40] hover:bg-[#e8dfd4]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <div className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm text-[#574a40]">
                  {user.displayName || user.email}
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-black/10 bg-white/80 text-[#201915] hover:bg-white"
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="rounded-full bg-[#b43c2e] px-5 text-white hover:bg-[#9f3226]"
              >
                Sign in
              </Button>
            )}
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/80 lg:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-black/5 bg-[#f4efe8] px-5 pb-5 pt-3 lg:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                    activeTab === item.id ? 'bg-[#1f1b17] text-white' : 'bg-white/80 text-[#574a40]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {!user ? (
                <Button onClick={handleLogin} className="mt-3 rounded-2xl bg-[#b43c2e] text-white hover:bg-[#9f3226]">
                  Sign in
                </Button>
              ) : (
                <Button onClick={handleLogout} variant="outline" className="mt-3 rounded-2xl border-black/10">
                  Sign out
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{renderActiveTab()}</main>
      <Toaster position="top-right" richColors theme="light" />
    </div>
  );
}
