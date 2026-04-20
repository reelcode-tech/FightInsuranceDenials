import React from 'react';
import { DenialRecord } from "@/src/types";
import { toast } from "sonner";
import ObservatoryExperience from "@/src/components/ObservatoryExperience";
import { type PatternsResponse } from '@/src/lib/insightsPresentation';
import { normalizePublicStoryCount } from '@/src/lib/publicMetrics';

export default function Dashboard() {
  const STORY_SEED_KEY = 'fid_story_seed';
  const [featuredStories, setFeaturedStories] = React.useState<DenialRecord[]>([]);
  const [realCount, setRealCount] = React.useState<number | null>(null);
  const [topCategoryLabel, setTopCategoryLabel] = React.useState<string>('N/A');
  const [searchTerm, setSearchTerm] = React.useState("");
  const [patterns, setPatterns] = React.useState<PatternsResponse | null>(null);

  const fetchHomepageData = async () => {
    try {
      const [summaryResp, patternsResp] = await Promise.all([
        fetch('/api/observatory/summary', { cache: 'no-store' }),
        fetch('/api/insights/patterns', { cache: 'no-store' }),
      ]);

      const summaryContentType = summaryResp.headers.get('content-type') || '';
      if (summaryResp.ok && summaryContentType.includes('application/json')) {
        const warehouseData = await summaryResp.json();
        if (warehouseData?.totalVisibleCount !== null && warehouseData?.totalVisibleCount !== undefined) {
          setRealCount(warehouseData.totalVisibleCount);
        }
        if (warehouseData?.topCategory) {
          setTopCategoryLabel(warehouseData.topCategory);
        }
        if (Array.isArray(warehouseData?.featuredStories) && warehouseData.featuredStories.length) {
          setFeaturedStories(warehouseData.featuredStories);
        }
      }

      const patternsContentType = patternsResp.headers.get('content-type') || '';
      if (patternsResp.ok && patternsContentType.includes('application/json')) {
        const data = await patternsResp.json();
        if (data?.status === 'success') setPatterns(data);
      }

    } catch (e) {
      console.error("Failed to fetch homepage data", e);
    }
  };

  React.useEffect(() => {
    fetchHomepageData();

    const refreshInterval = window.setInterval(() => {
      fetchHomepageData();
    }, 45000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, []);

  const topCategory = patterns?.topCategories?.[0];

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
      totalStories={normalizePublicStoryCount(realCount)}
      topCategory={topCategoryLabel !== 'N/A' ? topCategoryLabel : (topCategory?.label || 'Coverage denial')}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onNavigate={navigate}
      onOpenRecordFromQuery={openRecordFromQuery}
      onStartStoryFromQuery={seedStoryFromQuery}
    />
  );
}
