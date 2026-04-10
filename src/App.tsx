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
    { id: 'home', label: 'Observatory', icon: Globe },
    { id: 'insights', label: 'Data Insights', icon: BarChart3 },
    { id: 'appeal', label: 'Appeal Generator', icon: Zap },
    { id: 'share', label: 'Submit Story', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-80 bg-[#0A0A0B] border-r border-white/5 p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-4 mb-16 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/40 group-hover:scale-105 transition-all">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-white leading-none">Fight Insurance Denials</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1">Public Observatory</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full h-14 justify-start px-6 rounded-2xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(item.id as any)}
            >
              <item.icon className={`w-5 h-5 mr-4 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
              <span className="font-bold tracking-tight">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-6">
          {user ? (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                  {user.displayName?.[0] || user.email?.[0]}
                </div>
                <div className="max-w-[120px]">
                  <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-red-500/10 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all">
              Login to Contribute
            </Button>
          )}
          
          <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">System Status</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">AI Engine</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <nav className="lg:hidden sticky top-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 h-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white leading-tight">Fight Insurance Denials</span>
        </div>
        <Button 
          variant="ghost" 
          className="h-10 w-10 p-0"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#0A0A0B] pt-24 px-6 space-y-4">
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
          {!user && (
            <Button onClick={handleLogin} className="w-full h-16 bg-blue-600 text-white rounded-2xl text-xl font-bold">
              Login
            </Button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto bg-[#0A0A0B]">
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
