const clamp = (value) => Math.max(1, Math.min(10, Math.round(value)));
const sentenceCount = (text) => Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
const words = (text) => text.toLowerCase().match(/[a-z0-9’'-]+/g) ?? [];
const includesAny = (text, terms) => terms.some((term) => text.includes(term));

export function scoreArgument(argument, side) {
  const normalized = argument.trim().toLowerCase();
  const tokenList = words(normalized);
  const uniqueRatio = tokenList.length ? new Set(tokenList).size / tokenList.length : 0;
  const lengthScore = Math.min(10, 3 + tokenList.length / 8);
  const reasonSignals = ['because', 'therefore', 'since', 'so that', 'means that', 'results in'];
  const evidenceSignals = ['patient', 'healthcare', 'consent', 'agreement', 'memory', 'diagnostic', 'rights', 'lives'];
  const counterSignals = ['although', 'however', 'even if', 'while', 'opponents', 'critics', 'on the other hand'];
  const sideSignals = side === 'protect'
    ? ['agreement', 'accepted', 'saved lives', 'benefit', 'innovation', 'consent']
    : ['invalid', 'coercion', 'essential', 'fundamental', 'privacy', 'power imbalance'];

  const reasoningScore = clamp(lengthScore + (includesAny(normalized, reasonSignals) ? 2 : 0) + (sentenceCount(normalized) >= 2 ? 1 : 0));
  const relevanceScore = clamp(3 + evidenceSignals.filter((term) => normalized.includes(term)).length + sideSignals.filter((term) => normalized.includes(term)).length / 2);
  const counterScore = clamp(2 + (includesAny(normalized, counterSignals) ? 4 : 0) + (normalized.includes('but') ? 1 : 0) + (tokenList.length > 55 ? 1 : 0));
  const clarityScore = clamp(4 + uniqueRatio * 3 + (sentenceCount(normalized) <= 5 ? 1 : 0) - (tokenList.length > 95 ? 1 : 0));

  const totalScore = Math.round((reasoningScore * 0.35 + relevanceScore * 0.25 + counterScore * 0.2 + clarityScore * 0.2) * 10);
  const dimensions = [
    ['reasoning', reasoningScore],
    ['relevance', relevanceScore],
    ['counterargument awareness', counterScore],
    ['clarity', clarityScore],
  ];
  const strongest = [...dimensions].sort((a, b) => b[1] - a[1])[0][0];
  const weakest = [...dimensions].sort((a, b) => a[1] - b[1])[0][0];

  return {
    totalScore,
    reasoning: { score: reasoningScore, feedback: reasoningScore >= 7 ? 'Your conclusion follows from stated reasons.' : 'Add an explicit cause-and-effect chain.' },
    relevance: { score: relevanceScore, feedback: relevanceScore >= 7 ? 'You used facts central to this case.' : 'Tie the argument more closely to memory rights, consent, and essential care.' },
    counterargument: { score: counterScore, feedback: counterScore >= 7 ? 'You acknowledged the strongest competing concern.' : 'Name the strongest opposing concern and answer it directly.' },
    clarity: { score: clarityScore, feedback: clarityScore >= 7 ? 'The argument is concise and readable.' : 'Use shorter sentences and one clear claim per sentence.' },
    strength: `Your strongest dimension was ${strongest}.`,
    improvement: `Your next improvement should target ${weakest}.`,
    opposingArgument: side === 'protect'
      ? 'Essential healthcare creates unequal bargaining power; consent cannot be fully voluntary when refusal may mean losing treatment.'
      : 'Invalidating every agreement would erase patient choices and could remove the data needed to diagnose future patients safely.',
    fallbackUsed: true,
    rubricVersion: 'fallback-1.0',
  };
}
