import { extractDenialDataWithAI } from '../_lib/aiPipeline';
import { enforceRateLimit, methodNotAllowed, sendSafeError } from '../_lib/http';

export default async function handler(req: any, res: any) {
  if (!methodNotAllowed(req, res, 'POST')) {
    return;
  }

  if (!enforceRateLimit(req, res, { key: 'ai-extract', limit: 10, windowMs: 5 * 60_000 })) {
    return;
  }

  try {
    const { text, fileData } = req.body || {};
    const result = await extractDenialDataWithAI(String(text || ''), fileData);
    return res.status(200).json(result);
  } catch (error) {
    return sendSafeError(
      res,
      500,
      'We could not read that denial file right now. Please try again in a moment.',
      error,
      'ai-extract'
    );
  }
}
