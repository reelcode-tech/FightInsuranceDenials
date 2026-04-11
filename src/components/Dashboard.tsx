import React from 'react';
import { DenialRecord } from "@/src/types";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { countObservatoryRecords, fetchCurrentAnalytics, fetchFeaturedObservatoryStories, subscribeToPublicObservatoryRecords } from "@/src/lib/observatoryRepository";
import { toast } from "sonner";
import ObservatoryExperience from "@/src/components/ObservatoryExperience";

function normalizeInsurer(name: string) {
  const n = name.trim();
  if (n.match(/UnitedHealthcare|UHC|United Health|United|Optum|NaviHealth/i)) return "UnitedHealthcare";
  if (n.match(/Aetna|CVS/i)) return "Aetna";
  if (n.match(/Cigna/i)) return "Cigna";
  if (n.match(/Blue Cross|Blue Shield|BCBS|Anthem|Empire|Highmark/i)) return "Blue Cross Blue Shield";
  if (n.match(/Kaiser/i)) return "Kaiser Permanente";
  if (n.match(/Humana/i)) return "Humana";
  if (n.match(/Centene|Ambetter|WellCare/i)) return "Centene";
  return n;
}

export default function Dashboard() {
  const [featuredStories, setFeaturedStories] = React.useState<DenialRecord[]>([]);
  const [liveDenials, setLiveDenials] = React.useState<DenialRecord[]>([]);
  const [realCount, setRealCount] = React.useState<number | null>(null);
  const [topCategoryLabel, setTopCategoryLabel] = React.useState<string>('N/A');
  const [searchTerm, setSearchTerm] = React.useState("");
  const [diagStatus, setDiagStatus] = React.useState<{
    auth: string;
    firestore: string;
    backend: string;
    ai: string;
  }>({ auth: 'Checking...', firestore: 'Checking...', backend: 'Checking...', ai: 'Checking...' });

  const fetchRealCount = async () => {
    try {
      const warehouseResp = await fetch('/api/observatory/summary', { cache: 'no-store' });
      const contentType = warehouseResp.headers.get('content-type') || '';
      if (warehouseResp.ok && contentType.includes('application/json')) {
        const warehouseData = await warehouseResp.json();
        if (warehouseData?.totalVisibleCount !== null && warehouseData?.totalVisibleCount !== undefined) {
          setRealCount(warehouseData.totalVisibleCount);
        }
        if (warehouseData?.topCategory) {
          setTopCategoryLabel(warehouseData.topCategory);
        }
        if (Array.isArray(warehouseData?.featuredStories) && warehouseData.featuredStories.length) {
          setFeaturedStories(warehouseData.featuredStories);
        }
        return;
      }

      const analytics = await fetchCurrentAnalytics(db);
      if (analytics) {
        setRealCount((current) => {
          if (current !== null && current !== undefined) return current;
          if (analytics.total_public_stories !== null && analytics.total_public_stories !== undefined) {
            return analytics.total_public_stories;
          }
          if (analytics.total_stories !== null && analytics.total_stories !== undefined) {
            return analytics.total_stories;
          }
          return null;
        });
        setTopCategoryLabel(analytics.top_denial_categories?.[0]?.label || 'N/A');
        return;
      }

      const count = await countObservatoryRecords(db);
      setRealCount(count);
    } catch (e) {
      console.error("Failed to fetch real count", e);
    }
  };

  const fetchFeatured = async () => {
    try {
      const warehouseResp = await fetch('/api/observatory/summary', { cache: 'no-store' });
      const contentType = warehouseResp.headers.get('content-type') || '';
      if (warehouseResp.ok && contentType.includes('application/json')) {
        const warehouseData = await warehouseResp.json();
        if (Array.isArray(warehouseData?.featuredStories) && warehouseData.featuredStories.length) {
          setFeaturedStories(warehouseData.featuredStories);
          return;
        }
      }

      const stories = await fetchFeaturedObservatoryStories(db, 3);
      setFeaturedStories(stories);
    } catch (e) {
      console.error("Failed to fetch featured stories", e);
    }
  };

  const fetchStats = async () => {
    try {
      const q = query(collection(db, "stats"), limit(1));
      await getDocs(q);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const checkAI = async () => {
    try {
      const resp = await fetch("/api/admin/test-ai");
      const data = await resp.json();
      setDiagStatus(prev => ({ ...prev, ai: data.status === "success" ? "Connected" : "Error" }));
    } catch {
      setDiagStatus(prev => ({ ...prev, ai: "Offline" }));
    }
  };

  const runDiagnostics = async () => {
    setDiagStatus(prev => ({ ...prev, auth: auth.currentUser ? `Logged in as ${auth.currentUser.email}` : 'Not logged in' }));

    try {
      await countObservatoryRecords(db);
      setDiagStatus(prev => ({ ...prev, firestore: 'Connected & Readable' }));
    } catch (e) {
      setDiagStatus(prev => ({ ...prev, firestore: `Error: ${e}` }));
    }

    try {
      const resp = await fetch("/api/health");
      const data = await resp.json();
      setDiagStatus(prev => ({ ...prev, backend: data.status === "ok" ? `Engine Active (v${data.engine || '1.0'})` : 'Engine Offline' }));
    } catch (e) {
      setDiagStatus(prev => ({ ...prev, backend: `Error: ${e}` }));
    }
  };

  React.useEffect(() => {
    fetchRealCount();
    fetchFeatured();
    fetchStats();
    checkAI();
    runDiagnostics();

    const unsubscribe = subscribeToPublicObservatoryRecords(
      db,
      200,
      (records) => setLiveDenials(records),
      (error) => {
        console.error("Firestore snapshot error", error);
        handleFirestoreError(error, OperationType.LIST, "denials");
      }
    );

    const refreshInterval = window.setInterval(() => {
      fetchRealCount();
    }, 45000);

    return () => {
      unsubscribe();
      window.clearInterval(refreshInterval);
    };
  }, []);

  const filteredDenials = liveDenials.filter(d =>
    d.insurer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.procedure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.denialReason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const insurerData = Object.entries(
    filteredDenials.reduce((acc, d) => {
      if (d.insurer) {
        const canonical = normalizeInsurer(d.insurer);
        acc[canonical] = (acc[canonical] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const sourceData = Object.entries(
    filteredDenials.reduce((acc, d) => {
      const source = d.source?.split(' ')[0] || "Other";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(
    filteredDenials.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <ObservatoryExperience
      featuredStories={featuredStories}
      liveDenials={filteredDenials}
      totalStories={realCount ?? filteredDenials.length}
      topCategory={topCategoryLabel !== 'N/A' ? topCategoryLabel : (statusData[0]?.name || 'N/A')}
      aiStatus={diagStatus.ai}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onNavigate={(tab) => {
        window.dispatchEvent(new CustomEvent('nav', { detail: tab }));
        if (tab === 'insights') {
          toast.success("Opening observatory benchmarks");
        }
      }}
      insurerData={insurerData}
      sourceData={sourceData}
      statusData={statusData}
    />
  );
}
