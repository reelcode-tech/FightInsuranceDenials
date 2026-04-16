import type { DenialRecord } from '../../src/types.js';
import { generateAppealWithAI } from '../_lib/aiPipeline.js';
import { enforceRateLimit, methodNotAllowed, sendSafeError } from '../_lib/http.js';

export default async function handler(req: any, res: any) {
  if (!methodNotAllowed(req, res, 'POST')) {
    return;
  }

  if (!enforceRateLimit(req, res, { key: 'ai-generate-appeal', limit: 10, windowMs: 5 * 60_000 })) {
    return;
  }

  try {
    const denial = (req.body?.denial || {}) as DenialRecord;
    const result = await generateAppealWithAI(denial);
    return res.status(200).json(result);
  } catch (error) {
    return sendSafeError(
      res,
      500,
      'We could not generate the appeal right now. Please try again in a moment.',
      error,
      'ai-generate-appeal'
    );
  }
}
