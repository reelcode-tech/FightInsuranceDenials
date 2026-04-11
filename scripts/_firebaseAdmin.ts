import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const defaultServiceAccountPath = path.join(
  process.env.USERPROFILE || 'C:\\Users\\sashi',
  '.codex',
  'secrets',
  'fight-denials-firebase-admin.json'
);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(defaultServiceAccountPath)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = defaultServiceAccountPath;
}

export function getAdminDb() {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const serviceAccount =
      serviceAccountPath && fs.existsSync(serviceAccountPath)
        ? JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
        : null;

    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      ...(serviceAccount ? { credential: admin.credential.cert(serviceAccount) } : {}),
    });
  }

  return getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
}

export { admin, firebaseConfig };
