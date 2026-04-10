import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Zap, ShieldCheck, ArrowRight, Download, Copy, Mail, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { db } from "@/src/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import AppealGenerator from './AppealGenerator';

export default function AppealTools() {
  const [activeTool, setActiveTool] = useState<'generator' | 'benchmarks' | 'tracker'>('generator');
  const [benchmarkInsurer, setBenchmarkInsurer] = useState("UnitedHealthcare");
  const [benchmarkData, setBenchmarkData] = useState<{ success: number, total: number } | null>(null);

  useEffect(() => {
    if (activeTool === 'benchmarks') {
      fetchBenchmarks();
    }
  }, [benchmarkInsurer, activeTool]);

  const fetchBenchmarks = async () => {
    try {
      const q = query(collection(db, "denials"), where("insurer", "==", benchmarkInsurer));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => d.data());
      const overturned = docs.filter(d => d.status === 'overturned').length;
      setBenchmarkData({ success: overturned, total: docs.length });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-12 p-8 bg-[#0A0A0B] min-h-screen text-slate-200">
      <div className="space-y-6 border-b border-white/10 pb-12">
        <div className="inline-flex px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em]">AI Action Center</div>
        <h1 className="text-7xl font-bold tracking-tighter text-white">Appeal Tools.</h1>
        <p className="text-xl font-light text-slate-400">Professional-grade appeal generation and case benchmarking.</p>
      </div>

      {/* Tool Navigation */}
      <div className="flex flex-wrap gap-4">
        {[
          { id: 'generator', label: 'AI Appeal Generator', icon: Zap },
          { id: 'benchmarks', label: 'Case Benchmarks', icon: TrendingUp },
          { id: 'tracker', label: 'Appeal Tracker', icon: Clock }
        ].map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            className={`h-14 px-8 rounded-full font-bold transition-all ${
              activeTool === tool.id ? 'bg-blue-600 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'
            }`}
            onClick={() => setActiveTool(tool.id as any)}
          >
            <tool.icon className="w-5 h-5 mr-3" />
            {tool.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTool === 'generator' && (
          <motion.div 
            key="generator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <AppealGenerator />
              </div>
              <div className="space-y-8">
                <Card className="bg-blue-600/5 border-blue-500/20 p-8 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-500" />
                    <h4 className="text-lg font-bold text-white tracking-tight">AI Legal Guard</h4>
                  </div>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Our AI is trained on ERISA regulations and state-specific insurance codes to ensure your appeal uses the strongest possible legal language.
                  </p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Success Tip</p>
                    <p className="text-xs text-slate-300 italic">"Always request your full case file from the insurer. They are legally required to provide it."</p>
                  </div>
                </Card>

                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Workflow</h4>
                  <div className="space-y-4">
                    {[
                      { step: "01", title: "Upload", desc: "Scan your denial letter." },
                      { step: "02", title: "Analyze", desc: "AI extracts codes & reasons." },
                      { step: "03", title: "Personalize", desc: "Add your health context." },
                      { step: "04", title: "Weaponize", desc: "Download professional PDF." }
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <span className="text-xl font-bold text-blue-600/30">{s.step}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{s.title}</h4>
                          <p className="text-[10px] text-slate-500 font-light">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTool === 'benchmarks' && (
          <motion.div 
            key="benchmarks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <Card className="bg-white/5 border-white/10 p-12 rounded-[3rem] space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold text-white">Case Benchmarks</h3>
                  <p className="text-slate-400 text-lg font-light">See how others successfully overturned similar denials.</p>
                </div>
                <Select value={benchmarkInsurer} onValueChange={setBenchmarkInsurer}>
                  <SelectTrigger className="w-full md:w-[300px] h-16 bg-slate-900 border-white/10 rounded-full text-lg font-bold">
                    <SelectValue placeholder="Select Insurer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="UnitedHealthcare">UnitedHealthcare</SelectItem>
                    <SelectItem value="Aetna">Aetna</SelectItem>
                    <SelectItem value="Cigna">Cigna</SelectItem>
                    <SelectItem value="Blue Cross Blue Shield">Blue Cross Blue Shield</SelectItem>
                    <SelectItem value="Humana">Humana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-10 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] text-center space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Success Rate</p>
                  <p className="text-6xl font-bold text-white">
                    {benchmarkData ? Math.round((benchmarkData.success / (benchmarkData.total || 1)) * 100) : "0"}%
                  </p>
                  <p className="text-xs text-slate-500">Based on {benchmarkData?.total || 0} community cases</p>
                </div>
                <div className="p-10 bg-emerald-600/5 border border-emerald-500/20 rounded-[2.5rem] text-center space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Avg. Overturn Time</p>
                  <p className="text-6xl font-bold text-white">42</p>
                  <p className="text-xs text-slate-500">Days from first appeal</p>
                </div>
                <div className="p-10 bg-purple-600/5 border border-purple-500/20 rounded-[2.5rem] text-center space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400">Top Strategy</p>
                  <p className="text-3xl font-bold text-white">Medical Necessity</p>
                  <p className="text-xs text-slate-500">Most successful appeal reason</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTool === 'tracker' && (
          <motion.div 
            key="tracker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <Card className="bg-white/5 border-white/10 p-12 rounded-[3rem] space-y-12">
              <div className="space-y-4">
                <h3 className="text-4xl font-bold text-white">Appeal Tracker</h3>
                <p className="text-slate-400 text-lg font-light">Monitor your active appeals and receive pattern-break alerts.</p>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                      <Clock className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">MRI Lumbar Spine</h4>
                      <p className="text-sm text-slate-500">Aetna • Submitted 12 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">In Progress</p>
                      <p className="text-xs text-slate-400">Waiting for Insurer Response</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full"><ArrowRight className="w-5 h-5" /></Button>
                  </div>
                </div>

                <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-center border-dashed">
                  <p className="text-slate-500 font-light italic">No other active appeals found.</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
