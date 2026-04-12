import type { DenialRecord } from '../../src/types';
import { generateAppealWithAI } from '../_lib/aiPipeline';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const denial = (req.body?.denial || {}) as DenialRecord;
    const result = await generateAppealWithAI(denial);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
