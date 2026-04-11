export default async function handler(_req: any, res: any) {
  try {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const provider = process.env.AI_PROVIDER || 'auto';

    if (!hasGemini && !hasOpenAI) {
      res.status(200).json({
        status: 'error',
        message: 'No AI provider configured',
        provider: null,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      provider: provider === 'auto' ? (hasGemini ? 'gemini' : 'openai') : provider,
      engine: provider === 'auto' ? (hasGemini ? 'gemini' : 'openai') : provider,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
