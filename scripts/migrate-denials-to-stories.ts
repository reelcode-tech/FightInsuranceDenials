import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { legacyDenialToStory } from '../src/lib/storyMapper';
import { normalizeLegacyDenial, normalizedRecordToStoryPatch } from '../src/lib/normalization';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: firebaseConfig.projectId });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const includeLowSignal = args.has('--include-low-signal');

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }

  return value;
}

async function main() {
  const snap = await db.collection('denials').get();

  let eligible = 0;
  let skippedLowSignal = 0;
  let migrated = 0;

  for (const doc of snap.docs) {
    const normalized = normalizeLegacyDenial({ id: doc.id, ...doc.data() });

    if (normalized.is_low_signal && !includeLowSignal) {
      skippedLowSignal++;
      continue;
    }

    eligible++;
    const story = legacyDenialToStory(normalized);
    const patch = normalizedRecordToStoryPatch(normalized);

    const storyDoc = {
      ...story,
      ...patch,
      story_id: doc.id,
      status: normalized.isPublic ? 'published' : 'draft',
      timeline: {
        ...story.timeline,
        submission_timestamp: story.timeline.submission_timestamp || FieldValue.serverTimestamp(),
      },
      privacy: {
        ...story.privacy,
        is_anonymized: normalized.isPublic ? true : story.privacy.is_anonymized,
        public_story_ready: normalized.isPublic && !normalized.is_low_signal,
      },
      source: {
        ...story.source,
        source_record_id: doc.id,
      },
    };

    if (!dryRun) {
      await db.collection('stories').doc(doc.id).set(stripUndefined(storyDoc), { merge: true });
    }

    migrated++;
  }

  console.log(JSON.stringify({
    totalLegacy: snap.size,
    eligible,
    skippedLowSignal,
    migrated,
    dryRun,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
