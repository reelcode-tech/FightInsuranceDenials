import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { normalizeLegacyDenial } from '../src/lib/normalization';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: firebaseConfig.projectId });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

async function main() {
  const snap = await db.collection('denials').get();
  const batch = db.batch();
  let updated = 0;

  for (const doc of snap.docs) {
    const normalized = normalizeLegacyDenial({ id: doc.id, ...doc.data() });
    const patch: Record<string, unknown> = {
      insurer: normalized.insurer,
      denialReason: normalized.denialReason,
      procedure: normalized.procedure,
      denial_category: normalized.denial_category,
      source_type: normalized.source_type,
      quality_score: normalized.quality_score,
      is_low_signal: normalized.is_low_signal,
    };

    if ('reason' in doc.data() && !('denialReason' in doc.data())) {
      patch.denialReason = doc.data().reason;
    }

    if (!dryRun) {
      batch.set(doc.ref, patch, { merge: true });
    }
    updated++;
  }

  if (!dryRun) {
    await batch.commit();
  }

  console.log(JSON.stringify({ total: snap.size, updated, dryRun }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
