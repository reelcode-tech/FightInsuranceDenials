import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function check() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });

  const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
  const snap = await db.collection("denials").get();
  console.log(`Total records in Firestore (${firebaseConfig.firestoreDatabaseId}): ${snap.size}`);
  process.exit(0);
}

check();
