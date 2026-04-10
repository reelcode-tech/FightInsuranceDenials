import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SubmitDenial from './components/SubmitDenial';
import Insights from './components/Insights';
import AppealTools from './components/AppealTools';
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { LayoutDashboard, PlusCircle, Globe, ShieldAlert, Menu, X, Settings, Database, Users, LogOut, Zap, BarChart3, Info, TrendingUp } from 'lucide-react';
import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { toast } from 'sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'share' | 'appeal' | 'insights'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleNav = (e: any) => {
      setActiveTab(e.detail);
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
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Failed to sign in.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Signed out.");
  };

  const navItems = [
    { id: 'home', label: 'Observatory', icon: Database },
    { id: 'share', label: 'Share Story', icon: PlusCircle },
    { id: 'appeal', label: 'Appeal Tools', icon: Zap },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white">
      <nav className="sticky top-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 h-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-all">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">DenialWatch</span>
        </div>
        
        <div className="hidden xl:flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`h-10 px-4 font-medium rounded-full transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(item.id as any)}
            >
              <item.icon className="w-4 h-4" />
              <span className="ml-2">{item.label}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="xl:hidden h-10 w-10 p-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white">{user.displayName}</p>
                <p className="text-[10px] text-slate-500">{user.email}</p>
              </div>
              <Button onClick={handleLogout} variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-red-500/10 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all">
              Login
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-40 bg-[#0A0A0B] pt-24 px-6 space-y-4">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full h-16 justify-start px-6 text-xl font-bold rounded-2xl ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
            >
              <item.icon className="w-6 h-6 mr-4" />
              {item.label}
            </Button>
          ))}
        </div>
      )}

      <main className="container mx-auto py-8">
        <div className="animate-in fade-in duration-700">
          {activeTab === 'home' && <Dashboard />}
          {activeTab === 'share' && <SubmitDenial />}
          {activeTab === 'appeal' && <AppealTools />}
          {activeTab === 'insights' && <Insights />}
        </div>
      </main>
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}
