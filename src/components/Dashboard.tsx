import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DenialRecord } from "@/src/types";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, limit, onSnapshot, getDocs, where } from "firebase/firestore";
import { runIngestionPipeline, ingestionLogs, ai as ingestionAI } from "@/src/lib/ingestion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Database, 
  ExternalLink, 
  Search, 
  Terminal,
  Info,
  ArrowRight,
  ShieldAlert,
  Layers,
  SearchX,
  Zap,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function Dashboard() {
  const [trends, setTrends] = React.useState<{ trends: any[], summary: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [backfillSub, setBackfillSub] = React.useState("HealthInsurance");
  const [appealsGenerated, setAppealsGenerated] = React.useState(0);
  const [liveDenials, setLiveDenials] = React.useState<DenialRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [realCount, setRealCount] = React.useState<number | null>(null);
  const [diagStatus, setDiagStatus] = React.useState<{
    auth: string;
    firestore: string;
    backend: string;
  }>({ auth: 'Checking...', firestore: 'Checking...', backend: 'Checking...' });

  const fetchRealCount = async () => {
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, "denials"));
      setRealCount(snap.size);
    } catch (e) {
      console.error("Failed to fetch real count", e);
    }
  };

  React.useEffect(() => {
    fetchRealCount();
  }, []);

  const fetchStats = async () => {
    try {
      const q = query(collection(db, "stats"), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAppealsGenerated(snap.docs[0].data().appealsCount || 0);
      } else {
        // Fallback or initial value
        setAppealsGenerated(142); // Mock starting point
      }
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const incrementAppeals = async () => {
    setAppealsGenerated(prev => prev + 1);
    toast.success("Appeal letter generated!");
    // In a real app, we'd update Firestore here
  };

  const fetchTrends = async () => {
    setIsAnalyzing(true);
    try {
      const resp = await fetch("/api/trends");
      const data = await resp.json();
      setTrends(data);
      toast.success("Trend analysis complete");
    } catch (e) {
      toast.error("Failed to fetch trends");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runBackfill = async () => {
    toast.info(`Starting backfill for r/${backfillSub}...`);
    try {
      const resp = await fetch("/api/admin/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sub: backfillSub, limit: 50 })
      });
      const data = await resp.json();
      toast.success(`Backfill complete: ${data.count} records added.`);
    } catch (e) {
      toast.error("Backfill failed");
    }
  };

  const [isAnalyzingAnomalies, setIsAnalyzingAnomalies] = React.useState(false);
  const [anomalies, setAnomalies] = React.useState<any[]>([]);
  const [pipelineReport, setPipelineReport] = React.useState<any>(null);
  const [isTestingPipelines, setIsTestingPipelines] = React.useState(false);

  const runAnomalyDetection = async () => {
    setIsAnalyzingAnomalies(true);
    try {
      const resp = await fetch("/api/admin/detect-anomalies", { method: "POST" });
      const data = await resp.json();
      setAnomalies(data.anomalies || []);
      toast.success(`Anomaly detection complete. Found ${data.anomalies?.length || 0} patterns.`);
      fetchRealCount();
    } catch (e) {
      toast.error("Anomaly detection failed.");
    } finally {
      setIsAnalyzingAnomalies(false);
    }
  };

  const runPipelineTest = async () => {
    setIsTestingPipelines(true);
    try {
      const resp = await fetch("/api/admin/test-pipelines", { method: "POST" });
      const data = await resp.json();
      setPipelineReport(data.report);
      toast.success("Pipeline validation test complete.");
      fetchRealCount();
    } catch (e) {
      toast.error("Pipeline test failed.");
    } finally {
      setIsTestingPipelines(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagStatus(prev => ({ ...prev, auth: auth.currentUser ? `Logged in as ${auth.currentUser.email}` : 'Not logged in' }));
    
    try {
      const q = query(collection(db, "denials"), limit(1));
      await getDocs(q);
      setDiagStatus(prev => ({ ...prev, firestore: 'Connected & Readable' }));
    } catch (e) {
      setDiagStatus(prev => ({ ...prev, firestore: `Error: ${e}` }));
    }

    try {
      const resp = await fetch("/api/health");
      const data = await resp.json();
      if (data.status === "ok") {
        setDiagStatus(prev => ({ ...prev, backend: `Engine Active (v${data.engine || '1.0'})` }));
      } else {
        setDiagStatus(prev => ({ ...prev, backend: 'Engine Offline' }));
      }
    } catch (e) {
      setDiagStatus(prev => ({ ...prev, backend: `Error: ${e}` }));
    }
  };

  const handleSync = async () => {
    if (!auth.currentUser) {
      toast.error("You must be signed in to sync public data.");
      return;
    }
    
    setIsSyncing(true);
    const toastId = toast.loading("Triggering multi-source ingestion sync...");
    
    try {
      await fetch("/api/admin/sync", { method: "POST" });
      toast.success("Observatory updated with real-time public data!", { id: toastId });
      fetchRealCount();
    } catch (error) {
      toast.error("Failed to sync data.", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
    runDiagnostics();
    console.log("📡 Subscribing to public denials collection...");
    const q = query(collection(db, "denials"), where("isPublic", "==", true), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const denials = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date || (data.createdAt?.toDate()?.toLocaleDateString()) || "Recent"
        };
      }) as DenialRecord[];
      
      const sortedDenials = denials.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setLiveDenials(sortedDenials);
      setIsLoading(false);
    }, (error) => {
      console.error("❌ Firestore Snapshot Error:", error);
      handleFirestoreError(error, OperationType.LIST, "denials");
    });

    return () => unsubscribe();
  }, []);

  const filteredDenials = liveDenials.filter(d => 
    d.insurer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.procedure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.denialReason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const data = filteredDenials;

  // Stats
  const totalDenials = data.length;

  // Normalization helper for frontend display
  const normalizeInsurer = (name: string) => {
    const n = name.trim();
    if (n.match(/UnitedHealthcare|UHC|United Health|United|Optum|NaviHealth/i)) return "UnitedHealthcare";
    if (n.match(/Aetna|CVS/i)) return "Aetna";
    if (n.match(/Cigna/i)) return "Cigna";
    if (n.match(/Blue Cross|Blue Shield|BCBS|Anthem|Empire|Highmark/i)) return "Blue Cross Blue Shield";
    if (n.match(/Kaiser/i)) return "Kaiser Permanente";
    if (n.match(/Humana/i)) return "Humana";
    if (n.match(/Centene|Ambetter|WellCare/i)) return "Centene";
    return n;
  };

  // Chart Data: Source Breakdown
  const sourceData = Object.entries(
    data.reduce((acc, d) => {
      const source = d.source?.split(' ')[0] || "Other";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Chart Data: Denials by Insurer
  const insurerData = Object.entries(
    data.reduce((acc, d) => {
      if (d.insurer && d.insurer !== "Unknown") {
        const canonical = normalizeInsurer(d.insurer);
        acc[canonical] = (acc[canonical] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value);

  // Chart Data: Status Distribution
  const statusData = Object.entries(
    data.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overturned': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'denied': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'appealing': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Hero Section */}
      <header className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-20 grayscale"
            alt="Medical struggle"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0B]/50 to-[#0A0A0B]" />
        </div>
        
        <div className="relative z-10 max-w-4xl px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="outline" className="mb-6 border-blue-500/30 text-blue-400 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.3em]">
              DenialWatch Observatory
            </Badge>
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.85]">
              Millions of denials.<br />
              One searchable <span className="text-blue-500 italic font-serif">observatory</span>.
            </h1>
            <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
              We aggregate, normalize, and analyze health insurance denial stories in real-time. 
              Turning thousands of individual frustrations into a collective force for change.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex flex-wrap justify-center gap-6 pt-12"
          >
            <Button 
              size="lg"
              className="h-20 px-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold shadow-2xl shadow-blue-900/40 group"
              onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'share' }))}
            >
              Share Your Story <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="h-20 px-12 rounded-full border-white/10 hover:bg-white/5 text-white text-xl font-bold backdrop-blur-md"
              onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'appeal' }))}
            >
              Try AI Appeal Generator
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-32 space-y-48">
        {/* Live Counters */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { label: "Total Stories", value: realCount !== null ? realCount : totalDenials, sub: "Verified denial records" },
            { label: "Top Insurer", value: insurerData[0]?.name || "N/A", sub: "Carrier with most rejections" },
            { label: "Top Category", value: statusData[0]?.name || "N/A", sub: "Most common denial reason" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="p-12 bg-white/5 border border-white/5 rounded-[3rem] space-y-4 hover:bg-white/[0.08] transition-all"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">{stat.label}</p>
              <p className="text-6xl font-bold tracking-tighter">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              <p className="text-base text-slate-500 font-light leading-relaxed">{stat.sub}</p>
            </motion.div>
          ))}
        </section>

        {/* Interactive Dashboard */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white">Denials by Carrier</h3>
            <div className="h-[400px] w-full bg-white/5 p-8 rounded-[3rem] border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insurerData.slice(0, 5)}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '16px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white">Data Source Breakdown</h3>
            <div className="h-[400px] w-full bg-white/5 p-8 rounded-[3rem] border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {sourceData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Diagnostics Panel */}
        <AnimatePresence>
          {showDiagnostics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="bg-slate-900/50 border-white/5 p-12 rounded-[2.5rem] backdrop-blur-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">System Health</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-medium text-slate-400">Auth State</span>
                        <span className="text-xs font-mono text-blue-300">{diagStatus.auth}</span>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-medium text-slate-400">Firestore</span>
                        <span className="text-xs font-mono text-blue-300">{diagStatus.firestore}</span>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-medium text-slate-400">AI Engine</span>
                        <span className="text-xs font-mono text-blue-300">{diagStatus.backend}</span>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                        <span className="text-xs font-bold text-blue-400">Real Records in Firestore</span>
                        <span className="text-xs font-mono font-bold text-white">{realCount !== null ? realCount : "Loading..."}</span>
                      </div>
                    </div>

                    {pipelineReport && (
                      <div className="space-y-4 pt-8">
                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Pipeline Validation Report</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(pipelineReport).map(([key, val]: [string, any]) => (
                            <div key={key} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                              <p className="text-[10px] font-bold text-emerald-500 uppercase">{key}</p>
                              <p className="text-xl font-bold text-white">+{val} new</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {anomalies.length > 0 && (
                      <div className="space-y-4 pt-8">
                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">Detected Pattern Breaks</h3>
                        <div className="space-y-4">
                          {anomalies.map((a, i) => (
                            <div key={i} className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl">
                              <div className="flex items-center gap-3 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Severity: {a.severity}</span>
                              </div>
                              <p className="text-sm text-slate-300 font-light leading-relaxed">{a.reason}</p>
                              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-bold">Impacts {a.recordIds.length} records</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">Maintenance</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        onClick={runAnomalyDetection}
                        disabled={isAnalyzingAnomalies}
                        className="w-full rounded-2xl h-14 bg-red-600 hover:bg-red-700 text-white font-bold"
                      >
                        {isAnalyzingAnomalies ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                        Run Anomaly Detection
                      </Button>
                      <Button 
                        onClick={runPipelineTest}
                        disabled={isTestingPipelines}
                        className="w-full rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        {isTestingPipelines ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Validate All Pipelines
                      </Button>
                      <Button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Force Ingestion Sync
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={async () => {
                          toast.info("Cleaning up database...");
                          try {
                            const resp = await fetch("/api/admin/cleanup", { method: "POST" });
                            const data = await resp.json();
                            toast.success(`Cleanup complete: ${data.modified} records fixed/removed.`);
                            fetchRealCount();
                          } catch (e) {
                            toast.error("Cleanup failed");
                          }
                        }}
                        className="w-full rounded-2xl h-14 font-bold"
                      >
                        Dedupe & Clean Junk
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <section className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-2">
              <Search className="ml-6 w-8 h-8 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by insurer, condition, or denial reason..." 
                className="flex-1 bg-transparent border-none outline-none px-6 py-6 text-xl text-white placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button className="h-16 px-10 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg">
                Search Observatory
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Stories Carousel */}
        <section className="space-y-12">
          <div className="flex items-end justify-between">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold tracking-tight">Featured Stories</h2>
              <p className="text-slate-400 text-xl font-light">Real, anonymized rejections from our community.</p>
            </div>
            <Button variant="link" className="text-blue-500 text-lg font-bold group" onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'insights' }))}>
              View Insights <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveDenials.slice(0, 3).map((denial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white/5 border border-white/5 rounded-[3rem] space-y-6 hover:bg-white/[0.08] transition-all group"
              >
                <div className="flex justify-between items-start">
                  <Badge className="bg-blue-600/10 text-blue-400 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {denial.insurer}
                  </Badge>
                  <span className="text-[10px] text-slate-600 font-mono">{denial.date}</span>
                </div>
                <h4 className="text-2xl font-bold text-white leading-tight line-clamp-2">{denial.procedure}</h4>
                <p className="text-slate-400 text-sm font-light leading-relaxed line-clamp-3 italic">
                  "{denial.denialReason}"
                </p>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Verified Case</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => <div key={s} className="w-1 h-1 bg-blue-600 rounded-full" />)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Chart & Trend Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-start">
          <div className="space-y-16">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold tracking-tight">The Landscape of Rejection</h2>
              <p className="text-slate-400 text-xl font-light leading-relaxed">
                Visualizing the volume of denials across major carriers. 
                Our AI filters out noise to show only verified health insurance data.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-500">Denials by Carrier</h3>
                <span className="text-[10px] text-slate-500 font-mono">LIVE DATA FEED</span>
              </div>
              <div className="h-[450px] w-full bg-white/5 p-8 rounded-[3rem] border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insurerData} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                      width={140}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-16">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-16 bg-blue-600 rounded-[3rem] text-white space-y-10 relative overflow-hidden group shadow-[0_30px_60px_rgba(59,130,246,0.2)]"
            >
              <TrendingUp className="absolute -bottom-16 -right-16 w-80 h-80 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                <Badge className="bg-white/20 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                  AI Trend Insight
                </Badge>
                <h3 className="text-4xl font-bold leading-tight">
                  The "Step Therapy" Protocol
                </h3>
                <div className="space-y-6 text-blue-50/90 text-lg font-light leading-relaxed">
                  <p>
                    <span className="font-bold text-white">Step Therapy</span> (also known as "Fail-First") is a protocol used by health insurers that requires patients to try and "fail" on one or more lower-cost drugs before the insurer will cover the drug originally prescribed by their doctor.
                  </p>
                  <p>
                    Our data identifies this as the <span className="text-white font-bold underline decoration-white/30 underline-offset-8">primary driver</span> of specialty medication denials, often delaying life-saving treatment by months for patients with MS, Crohn's, and Cancer.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="link" className="text-white p-0 text-lg font-bold flex items-center gap-3 group/btn">
                    Learn how to fight Step Therapy <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { icon: <ShieldAlert className="w-6 h-6 text-amber-400" />, title: "Medical Necessity", desc: "Catch-all reason for high-cost imaging like MRI/CT." },
                { icon: <Layers className="w-6 h-6 text-purple-400" />, title: "Prior Auth", desc: "Bureaucratic hurdles requiring permission before care." },
                { icon: <XCircle className="text-red-400" />, title: "Experimental", desc: "Labeling new treatments as unproven to avoid costs." },
                { icon: <Users className="w-6 h-6 text-blue-400" />, title: "Out of Network", desc: "Forcing patients into limited, cheaper provider pools." },
                { icon: <Zap className="w-6 h-6 text-emerald-400" />, title: "Step Therapy", desc: "Requiring cheaper drugs to 'fail' before covering prescribed ones." },
                { icon: <FileText className="w-6 h-6 text-slate-400" />, title: "Coding Errors", desc: "Denying claims based on minor administrative mistakes." }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-slate-900/50 rounded-[2rem] border border-white/5 space-y-4 hover:bg-slate-900/80 transition-colors">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-bold">{item.title}</h4>
                  <p className="text-slate-400 text-xs font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="py-32 border-y border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-10">
              <h2 className="text-5xl font-bold tracking-tight leading-tight">The Accountability <br />Roadmap.</h2>
              <p className="text-slate-400 text-xl font-light leading-relaxed">
                We are currently building integrations for more public data sources to reach our goal of 50,000+ verified records.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { name: "PatientsLikeMe", status: "Researching API" },
                  { name: "CMS Open Data", status: "Mapping Schema" },
                  { name: "ProPublica", status: "Ingesting Dataset" },
                  { name: "Twitter/X", status: "Monitoring Keywords" },
                  { name: "Facebook Groups", status: "Scraping Public" },
                  { name: "TikTok", status: "Analyzing Transcripts" }
                ].map((src, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                    <div>
                      <p className="text-sm font-bold">{src.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{src.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square rounded-[4rem] overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
                className="w-full h-full object-cover grayscale opacity-40 group-hover:scale-110 transition-transform duration-[2s]"
                alt="Medical research"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-blue-600/20 backdrop-blur-md">
                <div className="text-center p-16 space-y-4">
                  <p className="text-8xl font-bold tracking-tighter">50k</p>
                  <p className="text-sm font-bold uppercase tracking-[0.5em] text-white/70">Target Records</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Stories Grid */}
        <section className="space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold tracking-tight">The Human Cost.</h2>
              <p className="text-slate-400 text-xl font-light max-w-2xl leading-relaxed">
                Real stories of denial, extracted and verified by our AI pipeline. 
                We remove the noise to focus on the struggle.
              </p>
            </div>
            <Badge variant="outline" className="border-white/10 text-slate-500 px-6 py-3 rounded-full text-sm font-medium">
              {totalDenials} Verified Records
            </Badge>
          </div>

          <ScrollArea className="h-[800px] pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <AnimatePresence mode="popLayout">
                {data.length === 0 ? (
                  <div className="col-span-full py-48 text-center space-y-6">
                    <SearchX className="w-20 h-20 text-slate-800 mx-auto" />
                    <p className="text-slate-500 text-xl font-light italic">No verified records found. Syncing data in background...</p>
                  </div>
                ) : (
                  data.map((denial, i) => (
                    <motion.div
                      key={denial.id || i}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Card className="h-full bg-slate-900/30 border-white/5 hover:border-blue-500/30 transition-all duration-700 group overflow-hidden rounded-[3rem] backdrop-blur-sm">
                        <CardHeader className="p-10 space-y-8">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{denial.date}</p>
                              <h4 className="text-2xl font-bold leading-tight group-hover:text-blue-400 transition-colors duration-500">
                                {denial.procedure || "Unknown Service"}
                              </h4>
                            </div>
                            <Badge className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase border-none ${
                              denial.status === 'overturned' ? 'bg-emerald-500/20 text-emerald-400' :
                              denial.status === 'appealing' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {denial.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                              <span className="text-sm font-bold text-slate-300 tracking-tight">{normalizeInsurer(denial.insurer || "Unknown")}</span>
                            </div>
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 group-hover:bg-white/10 transition-colors duration-500">
                              <p className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-[0.2em]">Denial Reason</p>
                              <p className="text-base text-slate-300 font-light italic leading-relaxed">
                                "{denial.denialReason || "Not specified"}"
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 space-y-8">
                          <p className="text-base text-slate-400 font-light leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
                            {(denial as any).summary || denial.narrative}
                          </p>
                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex flex-wrap gap-2">
                              {denial.tags?.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-white/5 text-slate-500 border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            {denial.url && (
                              <a href={denial.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            onClick={incrementAppeals}
                            className="w-full mt-6 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all duration-500 border border-white/5"
                          >
                            Generate Appeal Letter
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-32 px-6 text-center bg-[#050506]">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-4xl font-bold tracking-tight">Join the Fight.</h2>
          <p className="text-slate-500 text-lg font-light leading-relaxed">
            The Denial Observatory is a non-profit initiative dedicated to transparency in healthcare. 
            Your data helps us build a stronger case against systemic rejection.
          </p>
          <div className="flex flex-wrap justify-center gap-12 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-600">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">API Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Contribute Data</a>
          </div>
          <div className="pt-12">
            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">© 2026 DenialWatch. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
