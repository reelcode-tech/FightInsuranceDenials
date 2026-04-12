import React from 'react';
import { DenialRecord } from "@/src/types";
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
  const STORY_SEED_KEY = 'fid_story_seed';
  const [featuredStories, setFeaturedStories] = React.useState<DenialRecord[]>([]);
  const [realCount, setRealCount] = React.useState<number | null>(null);
  const [topCategoryLabel, setTopCategoryLabel] = React.useState<string>('N/A');
  const [searchTerm, setSearchTerm] = React.useState("");
  const [patterns, setPatterns] = React.useState<PatternsPayload | null>(null);

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

  React.useEffect(() => {
    fetchRealCount();
    fetchFeatured();
    fetchPatterns();

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
      eyebrow: 'What keeps happening first',
      title: topCategory ? `${topCategory.label} keeps coming up.` : 'Prior authorization keeps coming up.',
      body: topCategory
        ? `${topCategory.value.toLocaleString()} public stories already point to the same denial tactic.`
        : 'The strongest repeat fight in the record right now is prior authorization.',
    },
    {
      eyebrow: 'Which insurer shows up most',
      title: topInsurer ? `${topInsurer.label} is surfacing the most.` : 'Named insurer patterns are still forming.',
      body: patterns?.topInsurers?.length
        ? `${patterns.topInsurers.slice(0, 3).map((item) => item.label).join(', ')} are the names surfacing most often in patient stories.`
        : 'We only foreground payer patterns once the insurer name is clear enough to compare.',
    },
    {
      eyebrow: 'What care gets blocked over and over',
      title: topProcedure ? `${topProcedure.label} keeps getting blocked.` : 'Medication and treatment access are surfacing fastest.',
      body: topProcedure
        ? `${topProcedure.value.toLocaleString()} public stories already point to repeat friction around ${topProcedure.label.toLowerCase()}.`
        : 'The strongest early clusters are around medications, procedures, and specialist access.',
    },
  ];

  const confidenceNote = patterns
    ? `We pull from public patient stories, complaint platforms, condition communities, and benchmark sources, then narrow it down to ${patterns.overview.cleanPatternRows.toLocaleString()} stories we can already compare in plain English.`
    : 'We pull from public patient stories, complaint platforms, and benchmark sources, then narrow it down to the patterns we can explain clearly.';

  const navigate = (tab: 'share' | 'appeal' | 'insights') => {
    window.dispatchEvent(new CustomEvent('nav', { detail: tab }));
    if (tab === 'insights') {
      toast.success("Opening observatory benchmarks");
    }
  };

  const seedStoryFromQuery = () => {
    const query = searchTerm.trim();
    if (!query) {
      navigate('share');
      return;
    }

    window.sessionStorage.setItem(
      STORY_SEED_KEY,
      JSON.stringify({
        query,
        createdAt: new Date().toISOString(),
      }),
    );
    navigate('share');
  };

  const openRecordFromQuery = () => {
    const query = searchTerm.trim();
    if (query) {
      window.sessionStorage.setItem(
        'fid_record_query',
        JSON.stringify({
          query,
          createdAt: new Date().toISOString(),
        }),
      );
    }
    navigate('insights');
  };

  return (
    <ObservatoryExperience
      featuredStories={featuredStories}
      totalStories={realCount ?? 0}
      topCategory={topCategoryLabel !== 'N/A' ? topCategoryLabel : (topCategory?.label || 'Coverage denial')}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onNavigate={navigate}
      onOpenRecordFromQuery={openRecordFromQuery}
      onStartStoryFromQuery={seedStoryFromQuery}
      proofPoints={proofPoints}
      confidenceNote={confidenceNote}
    />
  );
}
