import { pilotCase } from './domain/case.js';
import { scoreArgument } from './domain/scoring.js';
import { buildChallengeUrl, challengeFromLocation } from './lib/challenge.js';
import { loadVerdicts, saveVerdict } from './lib/storage.js';

const MIN_ARGUMENT = 40;
const MAX_ARGUMENT = 500;
const state = {
  step: 'landing',
  ageConfirmed: false,
  alias: 'Counsel',
  incoming: challengeFromLocation(),
  side: 'protect',
  argument: '',
  verdict: null,
  shareUrl: '',
};
if (state.incoming?.challengerSide === 'protect') state.side = 'liberate';

const app = document.querySelector('#app');
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]);

function header() {
  return `<header class="topbar"><div class="brand-mark" aria-hidden="true">FC</div><div><strong>Future Court AI</strong><span>Vertical slice v0.1</span></div><span class="pilot-badge">LOCAL PILOT</span></header>`;
}
function footer() {
  const count = loadVerdicts().length;
  return `<footer><span>${count} local verdict${count === 1 ? '' : 's'} stored on this device</span><span>Fictional cases only</span></footer>`;
}
function scoreBar(label, dimension) {
  return `<div class="score-row"><div class="score-row__heading"><strong>${label}</strong><span>${dimension.score}/10</span></div><div class="score-track" aria-label="${label} score ${dimension.score} out of 10"><span style="width:${dimension.score * 10}%"></span></div><p>${escapeHtml(dimension.feedback)}</p></div>`;
}

function render() {
  let content = '';
  if (state.step === 'landing') {
    content = `<section class="hero panel"><p class="eyebrow">THE YEAR IS 2089</p><h1>Argue the future.<br>Face the verdict.</h1><p class="lede">Make a concise case, receive transparent rubric feedback, then challenge a friend to answer the same dispute.</p>${state.incoming ? `<div class="invite-note"><strong>${escapeHtml(state.incoming.challengerAlias)}</strong> challenged you. Their argument remains private until you finish.</div>` : ''}<button class="primary" data-action="start">${state.incoming ? 'Accept challenge' : 'Start today’s case'}</button><div class="promise-grid"><span>Under 3 minutes</span><span>Text only</span><span>Private by default</span></div></section>`;
  }
  if (state.step === 'age') {
    content = `<section class="panel narrow"><p class="eyebrow">ELIGIBILITY</p><h2>Future Court is for adults</h2><p>This pilot contains fictional ethical disputes. It does not provide legal advice or decide real cases.</p><label class="check"><input id="age" type="checkbox" ${state.ageConfirmed ? 'checked' : ''}> I confirm that I am at least 18 years old.</label><button class="primary" data-action="age-continue" ${state.ageConfirmed ? '' : 'disabled'}>Continue</button></section>`;
  }
  if (state.step === 'case') {
    content = `<section class="panel"><p class="eyebrow">CASE ${pilotCase.year}</p><h2>${pilotCase.title}</h2><p class="case-copy">${pilotCase.scenario}</p><div class="side-grid">${Object.entries(pilotCase.sides).map(([code, item]) => `<button class="side-card ${state.side === code ? 'selected' : ''}" data-side="${code}"><strong>${item.label}</strong><span>${item.position}</span></button>`).join('')}</div><div class="rubric"><span>Reasoning 35%</span><span>Relevance 25%</span><span>Counterargument 20%</span><span>Clarity 20%</span></div><button class="primary" data-action="argue">Argue this side</button></section>`;
  }
  if (state.step === 'argument') {
    content = `<section class="panel"><p class="eyebrow">YOUR ARGUMENT</p><h2>${pilotCase.sides[state.side].label}</h2><p class="position">${pilotCase.sides[state.side].position}</p><label class="field">Display alias<input id="alias" value="${escapeHtml(state.alias)}" maxlength="24"></label><label class="field">Your argument<textarea id="argument" maxlength="${MAX_ARGUMENT}" placeholder="State your claim, explain why it follows, and answer the strongest objection...">${escapeHtml(state.argument)}</textarea></label><div class="editor-meta"><span>Minimum ${MIN_ARGUMENT} characters</span><span id="counter">${state.argument.length}/${MAX_ARGUMENT}</span></div><div class="consent-note"><strong>Demo mode:</strong> this build uses a local deterministic rubric simulator. No argument is sent to an AI provider.</div><button class="primary" data-action="submit" ${state.argument.trim().length >= MIN_ARGUMENT ? '' : 'disabled'}>Submit for verdict</button></section>`;
  }
  if (state.step === 'verdict' && state.verdict) {
    const v = state.verdict;
    content = `<section class="panel verdict-panel"><p class="eyebrow">COURT VERDICT</p><div class="verdict-score"><span>${v.totalScore}</span><small>/100</small></div><p class="verdict-label">Rubric score — not legal truth</p>${scoreBar('Reasoning', v.reasoning)}${scoreBar('Relevance', v.relevance)}${scoreBar('Counterargument', v.counterargument)}${scoreBar('Clarity', v.clarity)}<div class="feedback-card"><strong>Strength</strong><p>${escapeHtml(v.strength)}</p><strong>Next improvement</strong><p>${escapeHtml(v.improvement)}</p></div><div class="counter-card"><strong>Opposing counsel argues</strong><p>${escapeHtml(v.opposingArgument)}</p></div>${state.incoming ? '<button class="primary" data-action="compare">Unlock comparison</button>' : `<button class="primary" data-action="challenge">Challenge a friend</button>${state.shareUrl ? `<div class="share-box"><strong>Challenge link ready</strong><input readonly value="${escapeHtml(state.shareUrl)}"></div>` : ''}`}<button class="secondary" data-action="reset">Try again</button></section>`;
  }
  if (state.step === 'comparison' && state.verdict && state.incoming) {
    content = `<section class="panel"><p class="eyebrow">CHALLENGE COMPLETE</p><h2>Two arguments. One future.</h2><div class="compare-grid"><article><span>${escapeHtml(state.incoming.challengerAlias)}</span><strong>${state.incoming.challengerScore}</strong><small>${pilotCase.sides[state.incoming.challengerSide].label}</small></article><article><span>${escapeHtml(state.alias)}</span><strong>${state.verdict.totalScore}</strong><small>${pilotCase.sides[state.side].label}</small></article></div><p class="neutral-note">This comparison measures rubric performance, not which side is legally or morally correct.</p><button class="primary" data-action="reset">Open another case</button></section>`;
  }
  app.innerHTML = header() + content + footer();
  bind();
}

function bind() {
  app.querySelector('[data-action="start"]')?.addEventListener('click', () => { state.step = 'age'; render(); });
  app.querySelector('#age')?.addEventListener('change', (event) => { state.ageConfirmed = event.target.checked; render(); });
  app.querySelector('[data-action="age-continue"]')?.addEventListener('click', () => { if (state.ageConfirmed) { state.step = 'case'; render(); } });
  app.querySelectorAll('[data-side]').forEach((button) => button.addEventListener('click', () => { state.side = button.dataset.side; render(); }));
  app.querySelector('[data-action="argue"]')?.addEventListener('click', () => { state.step = 'argument'; render(); });
  app.querySelector('#alias')?.addEventListener('input', (event) => { state.alias = event.target.value.slice(0, 24); });
  app.querySelector('#argument')?.addEventListener('input', (event) => { state.argument = event.target.value.slice(0, MAX_ARGUMENT); document.querySelector('#counter').textContent = `${state.argument.length}/${MAX_ARGUMENT}`; document.querySelector('[data-action="submit"]').disabled = state.argument.trim().length < MIN_ARGUMENT; });
  app.querySelector('[data-action="submit"]')?.addEventListener('click', () => {
    if (state.argument.trim().length < MIN_ARGUMENT) return;
    state.verdict = scoreArgument(state.argument, state.side);
    saveVerdict({ id: crypto.randomUUID(), caseId: pilotCase.id, side: state.side, verdict: state.verdict, createdAt: new Date().toISOString() });
    state.step = 'verdict'; render();
  });
  app.querySelector('[data-action="challenge"]')?.addEventListener('click', async () => {
    const payload = { version: 1, caseId: pilotCase.id, challengerAlias: state.alias.trim().slice(0, 24) || 'Counsel', challengerSide: state.side, challengerScore: state.verdict.totalScore, createdAt: new Date().toISOString() };
    state.shareUrl = buildChallengeUrl(payload);
    try { await navigator.clipboard.writeText(state.shareUrl); } catch { /* Copy is optional in local HTTP contexts. */ }
    render();
  });
  app.querySelector('[data-action="compare"]')?.addEventListener('click', () => { state.step = 'comparison'; render(); });
  app.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    history.replaceState({}, '', location.pathname); state.incoming = null; state.argument = ''; state.verdict = null; state.shareUrl = ''; state.side = 'protect'; state.step = 'case'; render();
  });
}

render();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/public/sw.js').catch(() => undefined));
