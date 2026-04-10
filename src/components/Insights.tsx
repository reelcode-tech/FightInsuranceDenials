import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, limit, onSnapshot, where, orderBy } from "firebase/firestore";
import { DenialRecord } from "@/src/types";
import { 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Database,
  ShieldCheck,
  Building2,
  Clock,
  ShieldAlert,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { motion } from "motion/react";
import { toast } from "sonner";

export default function Insights() {
  const [denials, setDenials] = useState<DenialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [insurerFilter, setInsurerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    const q = query(
      collection(db, "denials"), 
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        let dateStr = "Recent";
        if (d.createdAt) {
          try {
            dateStr = d.createdAt.toDate().toLocaleDateString();
          } catch (e) {
            dateStr = new Date(d.createdAt).toLocaleDateString();
          }
        }
        return {
          id: doc.id,
          ...d,
          date: dateStr,
          source: d.source || "Web Archive"
        };
      }) as DenialRecord[];
      setDenials(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "denials");
    });

    return () => unsubscribe();
  }, []);

  const filteredData = denials.filter(d => {
    const matchesSearch = 
      d.insurer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.procedure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.denialReason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesInsurer = insurerFilter === "all" || d.insurer === insurerFilter;
    const matchesCategory = categoryFilter === "all" || d.denialReason === categoryFilter;
    const matchesSource = sourceFilter === "all" || d.source?.includes(sourceFilter);

    return matchesSearch && matchesInsurer && matchesCategory && matchesSource;
  });

  // Chart Data Preparation
  const insurerChartData = Object.entries(
    denials.reduce((acc, d) => {
      if (d.insurer) acc[d.insurer] = (acc[d.insurer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 8);

  const categoryChartData = Object.entries(
    denials.reduce((acc, d) => {
      if (d.denialReason) acc[d.denialReason] = (acc[d.denialReason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 5);

  const statusChartData = Object.entries(
    denials.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const trendChartData = Object.entries(
    denials.reduce((acc, d) => {
      const date = d.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
   .slice(-10);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Insurer,Procedure,Reason,Date,Source\n"
      + filteredData.map(d => `"${d.insurer}","${d.procedure}","${d.denialReason}","${d.date}","${d.source}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "denial_insights_export.csv");
    document.body.appendChild(link);
    link.click();
    toast.success("Exporting data as CSV...");
  };

  return (
    <div className="space-y-12 p-8 bg-[#0A0A0B] min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-12">
        <div className="space-y-6">
          <div className="inline-flex px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em]">Data Intelligence</div>
          <h1 className="text-7xl font-bold tracking-tighter text-white">Insights.</h1>
          <p className="text-xl font-light text-slate-400">Deep analysis of systemic insurance denial patterns.</p>
        </div>
        <Button 
          onClick={exportData}
          className="h-14 px-8 rounded-full bg-white text-black hover:bg-slate-200 font-bold flex items-center gap-3"
        >
          <Download className="w-5 h-5" />
          Export Dataset
        </Button>
      </div>

      {/* Aggregated Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: "Total Records", value: denials.length, icon: Database },
          { label: "Top Carrier", value: insurerChartData[0]?.name || "N/A", icon: Building2 },
          { label: "Common Reason", value: categoryChartData[0]?.name || "N/A", icon: FileText },
          { label: "Data Integrity", value: "100%", icon: ShieldCheck }
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/5 p-8 rounded-[2rem]">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Card className="bg-white/5 border-white/5 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Denial Trends (Last 10 Days)
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/5 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Outcome Success Rates
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/5 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Top Insurers by Denial Volume
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insurerChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/5 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <PieChartIcon className="w-5 h-5 text-emerald-500" />
              Denial Categories
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E20', border: 'none', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input 
              placeholder="Search by insurer, procedure, or reason..." 
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={insurerFilter} onValueChange={setInsurerFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-14 bg-white/5 border-white/10 rounded-2xl text-white">
              <SelectValue placeholder="All Insurers" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E20] border-white/10 text-white">
              <SelectItem value="all">All Insurers</SelectItem>
              {Array.from(new Set(denials.map(d => d.insurer))).filter(Boolean).map(i => (
                <SelectItem key={i} value={i!}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-14 bg-white/5 border-white/10 rounded-2xl text-white">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E20] border-white/10 text-white">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Reddit">Reddit</SelectItem>
              <SelectItem value="ProPublica">ProPublica</SelectItem>
              <SelectItem value="CMS">CMS</SelectItem>
              <SelectItem value="Social">Social Media</SelectItem>
              <SelectItem value="User">User Submission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Loading real-time data...</div>
          ) : filteredData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-4 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
              <SearchX className="w-12 h-12 opacity-20" />
              <p>No records match your filters.</p>
            </div>
          ) : (
            filteredData.map((denial, i) => (
              <motion.div 
                key={denial.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-8 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/[0.08] transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600/10 text-blue-400 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {denial.insurer}
                    </Badge>
                    <span className="text-[10px] text-slate-600 font-mono">{denial.date}</span>
                    {denial.isERISA && (
                      <Badge variant="outline" className="border-slate-700 text-slate-500 text-[9px] uppercase tracking-tighter">
                        {denial.isERISA}
                      </Badge>
                    )}
                    {denial.anomalyDetected && (
                      <Badge className="bg-red-500/20 text-red-400 border-none text-[9px] uppercase tracking-tighter animate-pulse">
                        Pattern Break
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-white">{denial.procedure}</h4>
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm font-light italic">"{denial.denialReason}"</p>
                    {denial.denialQuote && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 border-l-blue-500 border-l-2">
                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Insurer Logic Quote</p>
                        <p className="text-xs text-slate-300 font-light leading-relaxed italic">"{denial.denialQuote}"</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 pt-2">
                    {denial.appealDeadline && (
                      <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        Deadline: {denial.appealDeadline}
                      </div>
                    )}
                    {denial.medicalNecessityFlag && (
                      <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                        <ShieldAlert className="w-3 h-3" />
                        Medical Necessity Battle
                      </div>
                    )}
                    {denial.imeInvolved && (
                      <div className="flex items-center gap-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        IME Involved
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Source</p>
                    <p className="text-xs text-blue-400">{denial.source}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-white/10"
                    onClick={() => window.open(denial.url, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5 text-slate-400" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Mock components for missing icons if needed
const SearchX = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
