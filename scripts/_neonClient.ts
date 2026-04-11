import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  return databaseUrl;
}

export async function withNeonClient<T>(fn: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString: requireDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
