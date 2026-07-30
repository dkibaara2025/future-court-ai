// Supabase Edge Function scaffold. Deploy only after secrets and consent copy are configured.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';

const rubricSchema = {
  type: 'object',
  properties: {
    reasoning: { type: 'object', properties: { score: { type: 'integer', minimum: 1, maximum: 10 }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
    relevance: { type: 'object', properties: { score: { type: 'integer', minimum: 1, maximum: 10 }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
    counterargument: { type: 'object', properties: { score: { type: 'integer', minimum: 1, maximum: 10 }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
    clarity: { type: 'object', properties: { score: { type: 'integer', minimum: 1, maximum: 10 }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
    strength: { type: 'string' }, improvement: { type: 'string' }, opposingArgument: { type: 'string' }
  },
  required: ['reasoning', 'relevance', 'counterargument', 'clarity', 'strength', 'improvement', 'opposingArgument']
};

serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!GEMINI_API_KEY) return Response.json({ error: 'AI_PROVIDER_NOT_CONFIGURED' }, { status: 503 });

  // TODO before deployment: verify Supabase JWT, consent version, Turnstile token,
  // rate limits, daily quota, idempotency key, case/side IDs, and input safety.
  const body = await request.json();
  const argument = String(body.argument ?? '').trim();
  if (argument.length < 40 || argument.length > 500) return Response.json({ error: 'INVALID_ARGUMENT' }, { status: 400 });

  const prompt = `You are a transparent rubric assessor for a fictional future-court game.\nEvaluate only the submitted argument. Do not provide legal advice.\nReturn concise feedback.\n\nARGUMENT:\n${argument}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: rubricSchema, temperature: 0.2, maxOutputTokens: 700 }
    })
  });
  if (!response.ok) return Response.json({ error: 'AI_PROVIDER_FAILED' }, { status: 502 });
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return Response.json({ error: 'INVALID_AI_OUTPUT' }, { status: 502 });
  return new Response(text, { headers: { 'content-type': 'application/json' } });
});
