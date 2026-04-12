import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  fetchWarehouseSummary,
  runWarehouseAutopilotPass,
  runWarehouseDeepBackfillPass,
} from '../src/lib/warehouseAutopilot';

type Mode = 'autopilot' | 'deep-backfill';

const mode = (process.argv[2] || 'autopilot') as Mode;
const validModes: Mode[] = ['autopilot', 'deep-backfill'];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

dotenv.config({ path: path.join(repoRoot, '.env') });
process.chdir(repoRoot);

if (!validModes.includes(mode)) {
  console.error(`Unsupported warehouse job mode: ${mode}`);
  process.exit(1);
}

const runtimeDir = path.join(repoRoot, '.runtime');
const lockDir = path.join(runtimeDir, 'locks');
const stateDir = path.join(runtimeDir, 'state');

fs.mkdirSync(lockDir, { recursive: true });
fs.mkdirSync(stateDir, { recursive: true });

const lockPath = path.join(lockDir, `${mode}.lock`);
const statePath = path.join(stateDir, `${mode}.json`);
const staleMs = mode === 'deep-backfill' ? 1000 * 60 * 60 * 12 : 1000 * 60 * 60 * 2;

function removeLock() {
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  } catch (error) {
    console.warn(`[warehouse:${mode}] Failed to remove lock`, error);
  }
}

function pidIsAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock() {
  if (fs.existsSync(lockPath)) {
    const rawExisting = fs.readFileSync(lockPath, 'utf8');
    let parsedExisting: { pid?: number } | null = null;
    try {
      parsedExisting = JSON.parse(rawExisting);
    } catch {
      parsedExisting = null;
    }

    if (parsedExisting?.pid && pidIsAlive(parsedExisting.pid)) {
      const stats = fs.statSync(lockPath);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs < staleMs) {
        console.log(`[warehouse:${mode}] Skipping because a recent lock already exists`, rawExisting);
        process.exit(0);
      }
    }

    removeLock();
  }

  fs.writeFileSync(
    lockPath,
    JSON.stringify(
      {
        mode,
        pid: process.pid,
        startedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

async function main() {
  acquireLock();

  try {
    const startedAt = new Date().toISOString();
    const result =
      mode === 'deep-backfill'
        ? await runWarehouseDeepBackfillPass()
        : await runWarehouseAutopilotPass();

    const summary = await fetchWarehouseSummary();
    const payload = {
      mode,
      startedAt,
      finishedAt: new Date().toISOString(),
      result,
      summary,
    };

    fs.writeFileSync(statePath, JSON.stringify(payload, null, 2));
    console.log(`[warehouse:${mode}] completed`, JSON.stringify(payload));
  } finally {
    removeLock();
  }
}

process.on('SIGINT', () => {
  removeLock();
  process.exit(1);
});

process.on('SIGTERM', () => {
  removeLock();
  process.exit(1);
});

main().catch((error) => {
  console.error(`[warehouse:${mode}] failed`, error);
  removeLock();
  process.exit(1);
});
