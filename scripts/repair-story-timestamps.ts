import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: firebaseConfig.projectId });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

async function main() {
  const snap = await db.collection('stories').get();
  const batch = db.batch();
  let repaired = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const needsSubmissionTimestamp =
      !data.timeline ||
      !data.timeline.submission_timestamp ||
      (typeof data.timeline.submission_timestamp === 'object' &&
        Object.keys(data.timeline.submission_timestamp).length === 0);

    const needsBenchmarkTimestamp =
      data.benchmark &&
      (
        !data.benchmark.updated_at ||
        (typeof data.benchmark.updated_at === 'object' &&
          Object.keys(data.benchmark.updated_at).length === 0)
      );

    if (!needsSubmissionTimestamp && !needsBenchmarkTimestamp) continue;

    const patch: Record<string, unknown> = {};
    if (needsSubmissionTimestamp) {
      patch['timeline.submission_timestamp'] = FieldValue.serverTimestamp();
    }
    if (needsBenchmarkTimestamp) {
      patch['benchmark.updated_at'] = FieldValue.serverTimestamp();
    }

    batch.update(doc.ref, patch);
    repaired++;
  }

  if (repaired > 0) {
    await batch.commit();
  }

  console.log(JSON.stringify({ repaired }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
