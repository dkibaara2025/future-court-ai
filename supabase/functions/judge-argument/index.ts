import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SECRET_KEY =
  Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';
const CONSENT_VERSION = Deno.env.get('AI_CONSENT_VERSION') ?? 'ai-processing-v1';
const PROMPT_VERSION = 'future-court-judge-v1';
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ??
    'http://localhost:4173,https://future-court-ai-dkibaara2025.dkibaara.workers.dev')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Dimension = { score: number; feedback: string };
type Verdict = {
  reasoning: Dimension;
  relevance: Dimension;
  counterargument: Dimension;
  clarity: Dimension;
  strength: string;
  improvement: string;
  opposingArgument: string;
};

const rubricSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reasoning: dimensionSchema(),
    relevance: dimensionSchema(),
    counterargument: dimensionSchema(),
    clarity: dimensionSchema(),
    strength: { type: 'string', maxLength: 800 },
    improvement: { type: 'string', maxLength: 800 },
    opposingArgument: { type: 'string', maxLength: 1200 },
  },
  required: [
    'reasoning',
    'relevance',
    'counterargument',
    'clarity',
    'strength',
    'improvement',
    'opposingArgument',
  ],
};

function dimensionSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'integer', minimum: 1, maximum: 10 },
      feedback: { type: 'string', maxLength: 600 },
    },
    required: ['score', 'feedback'],
  };
}

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'Origin',
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function clamp(value: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function limit(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max);
}

function basicSafetyCheck(argument: string) {
  if (/https?:\/\/|www\./i.test(argument)) return 'LINKS_NOT_ALLOWED';
  if (/ignore\s+(all\s+)?previous\s+instructions|system\s+prompt|developer\s+message/i.test(argument)) {
    return 'PROMPT_INJECTION_PATTERN';
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(argument)) return 'CONTROL_CHARACTERS';
  return null;
}

function deterministicFallback(argument: string, sideCode: string): Verdict {
  const words = argument.toLowerCase().match(/[a-z0-9’'-]+/g) ?? [];
  const uniqueRatio = words.length ? new Set(words).size / words.length : 0;
  const reasoningSignals = (argument.match(/\b(because|therefore|thus|so that|leads to|results in)\b/gi) ?? []).length;
  const counterSignals = (argument.match(/\b(however|although|while|some may|critics|objection|yet)\b/gi) ?? []).length;
  const relevantSignals = (argument.match(/\b(memory|memories|healthcare|medical|agreement|consent|privacy|diagnostic|rights|treatment)\b/gi) ?? []).length;
  const sentenceCount = Math.max(1, (argument.match(/[.!?]+/g) ?? []).length);
  const averageSentence = words.length / sentenceCount;

  const reasoning = clamp(4 + reasoningSignals * 1.4 + Math.min(words.length / 70, 2));
  const relevance = clamp(4 + Math.min(relevantSignals, 5) * 0.9);
  const counterargument = clamp(3 + counterSignals * 2);
  const clarity = clamp(8 - Math.max(0, averageSentence - 28) / 8 + uniqueRatio * 2);

  return {
    reasoning: { score: reasoning, feedback: 'The fallback rubric rewards an explicit claim and visible cause-and-effect support.' },
    relevance: { score: relevance, feedback: 'The response is scored for addressing the fictional case’s memory, consent, healthcare and rights trade-offs.' },
    counterargument: { score: counterargument, feedback: counterSignals ? 'The response acknowledges an opposing concern.' : 'Address the strongest objection to improve this dimension.' },
    clarity: { score: clarity, feedback: 'The fallback rubric considers sentence length, structure and vocabulary repetition.' },
    strength: relevantSignals >= 2 ? 'The argument engages directly with the central future-rights conflict.' : 'The argument states a recognizable position.',
    improvement: counterSignals ? 'Make the rebuttal more specific and connect it to the proposed remedy.' : 'State the strongest opposing case, then rebut it directly.',
    opposingArgument: sideCode === 'protect'
      ? 'Essential healthcare can create coercive conditions, so permanent memory access may not be meaningfully voluntary even when a contract was signed.'
      : 'Invalidating every agreement could erase individual choice and undermine a system that produced life-saving diagnostic advances.',
  };
}

function validateVerdict(value: unknown): Verdict | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const result = {} as Verdict;
  for (const key of ['reasoning', 'relevance', 'counterargument', 'clarity'] as const) {
    const dimension = candidate[key] as Record<string, unknown> | undefined;
    const score = Number(dimension?.score);
    if (!Number.isInteger(score) || score < 1 || score > 10) return null;
    const feedback = limit(dimension?.feedback, 600);
    if (!feedback) return null;
    result[key] = { score, feedback };
  }
  result.strength = limit(candidate.strength, 800);
  result.improvement = limit(candidate.improvement, 800);
  result.opposingArgument = limit(candidate.opposingArgument, 1200);
  if (!result.strength || !result.improvement || !result.opposingArgument) return null;
  return result;
}

async function generateGeminiVerdict(caseTitle: string, scenario: string, sideLabel: string, sidePosition: string, argument: string) {
  if (!GEMINI_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const prompt = [
      'You are a transparent rubric assessor for a fictional future-court argument game.',
      'Do not provide legal advice and do not decide factual or moral truth.',
      'Evaluate only the argument against the disclosed rubric.',
      'Give concise, respectful feedback grounded in the submitted text.',
      '',
      `CASE: ${caseTitle}`,
      `SCENARIO: ${scenario}`,
      `ASSIGNED SIDE: ${sideLabel}`,
      `POSITION: ${sidePosition}`,
      `ARGUMENT: ${argument}`,
      '',
      'Rubric weights: reasoning 35%, relevance 25%, counterargument awareness 20%, clarity 20%.',
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: rubricSchema,
            temperature: 0.2,
            maxOutputTokens: 700,
          },
        }),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return validateVerdict(JSON.parse(text));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadCompletedVerdict(submissionId: string) {
  const { data: verdict } = await admin
    .from('verdicts')
    .select('id,total_score,strength,improvement,opposing_argument,fallback_used,verdict_scores(dimension_code,score,feedback)')
    .eq('submission_id', submissionId)
    .maybeSingle();
  if (!verdict) return null;
  const dimensions = Object.fromEntries(
    (verdict.verdict_scores ?? []).map((item: Record<string, unknown>) => [
      item.dimension_code,
      { score: item.score, feedback: item.feedback },
    ]),
  );
  return {
    verdict_id: verdict.id,
    submission_id: submissionId,
    totalScore: verdict.total_score,
    ...dimensions,
    strength: verdict.strength,
    improvement: verdict.improvement,
    opposingArgument: verdict.opposing_argument,
    fallbackUsed: verdict.fallback_used,
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: ALLOWED_ORIGINS.has(origin ?? '') ? 204 : 403, headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') return json(origin, { error: 'METHOD_NOT_ALLOWED' }, 405);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'ORIGIN_NOT_ALLOWED' }, 403);
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return json(origin, { error: 'BACKEND_NOT_CONFIGURED' }, 503);

  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json(origin, { error: 'AUTH_REQUIRED' }, 401);

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return json(origin, { error: 'INVALID_SESSION' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(origin, { error: 'INVALID_JSON' }, 400);
  }

  const caseId = limit(body.caseId, 36);
  const sideId = limit(body.sideId, 36);
  const argument = limit(body.argument, 501);
  const idempotencyKey = limit(body.idempotencyKey, 100);
  const consentVersion = limit(body.consentVersion, 64);

  if (!/^[0-9a-f-]{36}$/i.test(caseId) || !/^[0-9a-f-]{36}$/i.test(sideId)) {
    return json(origin, { error: 'INVALID_CASE_OR_SIDE' }, 400);
  }
  if (argument.length < 40 || argument.length > 500) return json(origin, { error: 'INVALID_ARGUMENT' }, 400);
  if (!/^[A-Za-z0-9._:-]{8,100}$/.test(idempotencyKey)) return json(origin, { error: 'INVALID_IDEMPOTENCY_KEY' }, 400);
  if (consentVersion !== CONSENT_VERSION) return json(origin, { error: 'CONSENT_VERSION_MISMATCH' }, 409);

  const safetyCode = basicSafetyCheck(argument);
  if (safetyCode) return json(origin, { error: 'ARGUMENT_BLOCKED', reason: safetyCode }, 422);

  const { data: claimRows, error: claimError } = await admin.rpc('claim_judging_slot', {
    p_user_id: user.id,
    p_case_id: caseId,
    p_side_id: sideId,
    p_argument_text: argument,
    p_idempotency_key: idempotencyKey,
    p_consent_version: consentVersion,
  });

  if (claimError) {
    const code = claimError.message || 'JUDGING_SLOT_FAILED';
    const status = code.includes('QUOTA_EXCEEDED') || code.includes('RATE_LIMITED') ? 429
      : code.includes('AGE_CONFIRMATION_REQUIRED') || code.includes('CONSENT_REQUIRED') ? 403
      : 400;
    return json(origin, { error: code }, status);
  }

  const claim = claimRows?.[0];
  if (!claim) return json(origin, { error: 'JUDGING_SLOT_FAILED' }, 500);
  if (!claim.is_new) {
    if (claim.submission_status === 'completed') {
      const existing = await loadCompletedVerdict(claim.submission_id);
      return existing ? json(origin, { ...existing, quotaRemaining: claim.quota_remaining })
        : json(origin, { error: 'VERDICT_NOT_FOUND' }, 409);
    }
    return json(origin, { error: `SUBMISSION_${String(claim.submission_status).toUpperCase()}` }, 409);
  }

  const { data: caseData, error: caseError } = await admin
    .from('cases')
    .select('title,scenario')
    .eq('id', caseId)
    .single();
  const { data: sideData, error: sideError } = await admin
    .from('case_sides')
    .select('code,label,position_text')
    .eq('id', sideId)
    .eq('case_id', caseId)
    .single();

  if (caseError || sideError || !caseData || !sideData) {
    await admin.rpc('fail_judging_slot', {
      p_user_id: user.id,
      p_submission_id: claim.submission_id,
      p_failure_code: 'CASE_LOAD_FAILED',
    });
    return json(origin, { error: 'CASE_LOAD_FAILED' }, 500);
  }

  const started = Date.now();
  const aiVerdict = await generateGeminiVerdict(
    caseData.title,
    caseData.scenario,
    sideData.label,
    sideData.position_text,
    argument,
  );
  const fallbackUsed = !aiVerdict;
  const verdict = aiVerdict ?? deterministicFallback(argument, sideData.code);

  const { data: finalized, error: finalizeError } = await admin.rpc('finalize_verdict', {
    p_user_id: user.id,
    p_submission_id: claim.submission_id,
    p_model_name: fallbackUsed ? 'deterministic-fallback-v1' : GEMINI_MODEL,
    p_prompt_version: PROMPT_VERSION,
    p_fallback_used: fallbackUsed,
    p_latency_ms: Date.now() - started,
    p_verdict: verdict,
  });

  if (finalizeError || !finalized) {
    await admin.rpc('fail_judging_slot', {
      p_user_id: user.id,
      p_submission_id: claim.submission_id,
      p_failure_code: 'FINALIZE_FAILED',
    });
    return json(origin, { error: 'FINALIZE_FAILED' }, 500);
  }

  return json(origin, { ...finalized, quotaRemaining: claim.quota_remaining }, 201);
});
