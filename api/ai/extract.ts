import { extractDenialDataWithAI } from '../_lib/aiPipeline';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, fileData } = req.body || {};
    const result = await extractDenialDataWithAI(String(text || ''), fileData);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
