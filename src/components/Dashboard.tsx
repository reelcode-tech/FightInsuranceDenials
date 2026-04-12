import React from 'react';
import { DenialRecord } from "@/src/types";
import { auth } from "@/src/lib/firebase";
import { toast } from "sonner";
import ObservatoryExperience from "@/src/components/ObservatoryExperience";

type MetricRow = { label: string; value: number };
type PatternsPayload = {
  status: 'success' | 'error';
  overview: {
    totalRows: number;
    cleanPatternRows: number;
    unknownInsurerPct: number;
  };
  topInsurers: MetricRow[];
  topCategories: MetricRow[];
  topProcedures: MetricRow[];
};

export default function Dashboard() {
  const [featuredStories, setFeaturedStories] = React.useState<DenialRecord[]>([]);
  const [realCount, setRealCount] = React.useState<number | null>(null);
  const [topCategoryLabel, setTopCategoryLabel] = React.useState<string>('N/A');
  const [searchTerm, setSearchTerm] = React.useState("");
  const [patterns, setPatterns] = React.useState<PatternsPayload | null>(null);
  const [diagStatus, setDiagStatus] = React.useState<{
    auth: string;
    backend: string;
    ai: string;
  }>({ auth: 'Checking...', backend: 'Checking...', ai: 'Checking...' });

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

    } catch (e) {
      console.error("Failed to fetch featured stories", e);
    }
  };

  const fetchPatterns = async () => {
    try {
      const resp = await fetch('/api/insights/patterns', { cache: 'no-store' });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok || !contentType.includes('application/json')) return;
      const data = await resp.json();
      if (data?.status === 'success') setPatterns(data);
    } catch (e) {
      console.error("Failed to fetch patterns", e);
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
    fetchPatterns();
    checkAI();
    runDiagnostics();

    const refreshInterval = window.setInterval(() => {
      fetchRealCount();
      fetchPatterns();
    }, 45000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, []);

  const topInsurer = patterns?.topInsurers?.[0];
  const topProcedure = patterns?.topProcedures?.[0];
  const topCategory = patterns?.topCategories?.[0];
  const proofPoints = [
    {
      eyebrow: 'What patients are fighting most',
      title: topCategory ? `${topCategory.label} is leading the current record.` : 'Prior authorization is leading the current record.',
      body: topCategory
        ? `${topCategory.value.toLocaleString()} cleaned stories currently cluster around ${topCategory.label.toLowerCase()} fights.`
        : 'The strongest repeat fight in the cleaned slice is prior authorization.',
    },
    {
      eyebrow: 'Which payers keep surfacing',
      title: topInsurer ? `${topInsurer.label} shows up the most when the insurer is clear.` : 'Named insurer patterns are still forming.',
      body: patterns?.topInsurers?.length
        ? `${patterns.topInsurers.slice(0, 3).map((item) => item.label).join(', ')} lead the labeled insurer slice right now.`
        : 'We only foreground payer patterns once the insurer can be confidently named.',
    },
    {
      eyebrow: 'What care gets blocked over and over',
      title: topProcedure ? `${topProcedure.label} keeps getting caught in the denial loop.` : 'Medication and treatment access are surfacing fastest.',
      body: topProcedure
        ? `${topProcedure.value.toLocaleString()} stories already point to repeat friction around ${topProcedure.label.toLowerCase()}.`
        : 'The strongest early clusters are around medications, procedures, and specialist access.',
    },
  ];

  const confidenceNote = patterns
    ? `We do not blindly chart everything we pull in. The public-facing record currently shows ${patterns.overview.cleanPatternRows.toLocaleString()} cleaned stories, while a larger raw archive is still being labeled and de-noised. Right now, ${patterns.overview.unknownInsurerPct}% of raw rows still need a confidently named insurer, so we only surface patterns we can explain.`
    : 'We only surface patterns once they are clean enough to explain in plain English.';

  return (
    <ObservatoryExperience
      featuredStories={featuredStories}
      totalStories={realCount ?? 0}
      topCategory={topCategoryLabel !== 'N/A' ? topCategoryLabel : (topCategory?.label || 'Coverage denial')}
      aiStatus={diagStatus.ai}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onNavigate={(tab) => {
        window.dispatchEvent(new CustomEvent('nav', { detail: tab }));
        if (tab === 'insights') {
          toast.success("Opening observatory benchmarks");
        }
      }}
      proofPoints={proofPoints}
      confidenceNote={confidenceNote}
    />
  );
}
