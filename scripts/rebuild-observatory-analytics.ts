import { FieldValue } from 'firebase-admin/firestore';
import type { GlobalAnalytics, ObservatoryStory } from '../src/types/domain';
import { admin, getAdminDb } from './_firebaseAdmin';

const db = getAdminDb();

type CountMap = Record<string, number>;

function sortCountMap(map: CountMap, limit = 10) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function increment(map: CountMap, key?: string) {
  const safeKey = key && key.trim() ? key.trim() : 'Unknown';
  map[safeKey] = (map[safeKey] || 0) + 1;
}

function benchmarkKey(story: ObservatoryStory) {
  return [
    story.coverage.extracted_insurer || 'Unknown',
    story.clinical.denial_category || 'Unknown',
    story.clinical.procedure_condition || 'Unknown',
  ].join('||');
}

async function main() {
  const snapshot = await db.collection('stories').get();
  const stories = snapshot.docs.map((doc) => {
    const data = doc.data() as ObservatoryStory;
    return {
      ...data,
      story_id: data.story_id || doc.id,
    };
  });

  const publicStories = stories.filter((story) => story.privacy?.consent_level === 'public_story');
  const insurerCounts: CountMap = {};
  const procedureCounts: CountMap = {};
  const categoryCounts: CountMap = {};
  const sourceCounts: CountMap = {};
  const benchmarkCounts: CountMap = {};

  let totalAppeals = 0;
  let totalOverturned = 0;

  for (const story of publicStories) {
    increment(insurerCounts, story.coverage?.extracted_insurer);
    increment(procedureCounts, story.clinical?.procedure_condition);
    increment(categoryCounts, story.clinical?.denial_category);
    increment(sourceCounts, story.source?.source_label || story.source?.source_type);
    increment(benchmarkCounts, benchmarkKey(story));
  }

  const appealsSnapshot = await db.collection('appeals').get().catch(() => null);
  if (appealsSnapshot) {
    for (const doc of appealsSnapshot.docs) {
      const appeal = doc.data() as Record<string, any>;
      totalAppeals += 1;
      if (appeal.outcome === 'overturned' || appeal.outcome === 'partial') {
        totalOverturned += 1;
      }
    }
  }

  let benchmarkPatched = 0;
  let anomalyPatched = 0;

  for (const story of publicStories) {
    const key = benchmarkKey(story);
    const similarCasesCount = benchmarkCounts[key] || 0;
    const overturnRate = totalAppeals > 0 ? totalOverturned / totalAppeals : 0;
    const insurerCount = insurerCounts[story.coverage?.extracted_insurer || 'Unknown'] || 0;
    const categoryCount = categoryCounts[story.clinical?.denial_category || 'Unknown'] || 0;
    const anomalyDetected = similarCasesCount >= 3 && insurerCount >= 5 && categoryCount >= 4;
    const anomalyReason = anomalyDetected
      ? `${story.coverage.extracted_insurer} shows repeated ${story.clinical.denial_category.toLowerCase()} patterns for ${story.clinical.procedure_condition}.`
      : null;

    await db.collection('stories').doc(story.story_id).set(
      {
        benchmark: {
          similar_cases_count: similarCasesCount,
          overturn_rate: Number(overturnRate.toFixed(3)),
          methodology_version: 'analytics-v1',
          updated_at: FieldValue.serverTimestamp(),
        },
        anomaly_detected: anomalyDetected,
        anomaly_reason: anomalyReason,
      },
      { merge: true }
    );

    benchmarkPatched += 1;
    if (anomalyDetected) anomalyPatched += 1;
  }

  const analytics: GlobalAnalytics = {
    analytics_id: 'current',
    total_stories: stories.length,
    total_public_stories: publicStories.length,
    total_private_cases: stories.length - publicStories.length,
    total_appeals: totalAppeals,
    total_overturned: totalOverturned,
    top_denied_procedures: sortCountMap(procedureCounts),
    insurers_by_denial_count: sortCountMap(insurerCounts),
    average_overturn_rate: totalAppeals > 0 ? Number((totalOverturned / totalAppeals).toFixed(3)) : 0,
    updated_at: new Date().toISOString(),
  };

  await db.collection('analytics').doc('current').set(
    {
      ...analytics,
      top_denial_categories: sortCountMap(categoryCounts),
      sources_by_record_count: sortCountMap(sourceCounts),
      anomaly_story_count: anomalyPatched,
      methodology_version: 'analytics-v1',
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    JSON.stringify(
      {
        totalStories: stories.length,
        totalPublicStories: publicStories.length,
        totalAppeals,
        totalOverturned,
        benchmarkPatched,
        anomalyPatched,
      },
      null,
      2
    )
  );
  await Promise.all(admin.apps.map((app) => app.delete()));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
