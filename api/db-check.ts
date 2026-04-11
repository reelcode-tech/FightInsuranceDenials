import { neon } from '@neondatabase/serverless';

export default async function handler(_req: any, res: any) {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      res.status(200).json({
        status: 'error',
        message: 'DATABASE_URL missing',
      });
      return;
    }

    const sql = neon(connectionString);
    const result = await sql`SELECT COUNT(*)::int AS count FROM curated_stories`;

    res.status(200).json({
      status: 'success',
      count: result[0]?.count ?? 0,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
