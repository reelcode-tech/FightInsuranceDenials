import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { computeQualityScore, inferDenialCategory, normalizeInsurerName } from '../src/lib/normalization';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: firebaseConfig.projectId });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

async function main() {
  const snap = await db.collection('denials').get();
  const sourceCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const insurerCounts = new Map<string, number>();

  let unknownInsurer = 0;
  let unknownProcedure = 0;
  let unknownReason = 0;
  let lowSignal = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const source = d.source || 'missing';
    const insurer = normalizeInsurerName(d.insurer);
    const category = inferDenialCategory(d);
    const quality = computeQualityScore(d);

    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    insurerCounts.set(insurer, (insurerCounts.get(insurer) || 0) + 1);

    if (insurer === 'Unknown') unknownInsurer++;
    if ((d.procedure || '').toLowerCase() === 'unknown') unknownProcedure++;
    if (((d.denialReason || d.reason || '')).toLowerCase() === 'unknown') unknownReason++;
    if (quality < 35) lowSignal++;
  }

  console.log(JSON.stringify({
    total: snap.size,
    unknownInsurer,
    unknownProcedure,
    unknownReason,
    lowSignal,
    sourceCounts: Object.fromEntries([...sourceCounts.entries()].sort((a, b) => b[1] - a[1])),
    categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => b[1] - a[1])),
    topInsurers: Object.fromEntries([...insurerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
