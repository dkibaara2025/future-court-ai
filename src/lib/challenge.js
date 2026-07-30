const encodeBase64Url = (input) => Buffer.from(input, 'utf8').toString('base64url');
const decodeBase64Url = (input) => Buffer.from(input, 'base64url').toString('utf8');

const browserEncode = (input) => {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};
const browserDecode = (input) => {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - input.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function encodeChallenge(payload) {
  const json = JSON.stringify(payload);
  return typeof window === 'undefined' ? encodeBase64Url(json) : browserEncode(json);
}

export function decodeChallenge(token) {
  try {
    const raw = typeof window === 'undefined' ? decodeBase64Url(token) : browserDecode(token);
    const parsed = JSON.parse(raw);
    if (
      parsed.version !== 1 ||
      parsed.caseId !== 'memory-rights-2089' ||
      typeof parsed.challengerAlias !== 'string' ||
      parsed.challengerAlias.length < 1 ||
      parsed.challengerAlias.length > 24 ||
      !['protect', 'liberate'].includes(parsed.challengerSide) ||
      typeof parsed.challengerScore !== 'number' ||
      parsed.challengerScore < 10 ||
      parsed.challengerScore > 100 ||
      typeof parsed.createdAt !== 'string'
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildChallengeUrl(payload, currentUrl = window.location.href) {
  const url = new URL(currentUrl);
  url.search = '';
  url.hash = `challenge=${encodeChallenge(payload)}`;
  return url.toString();
}

export function challengeFromLocation(location = window.location) {
  const match = location.hash.match(/^#challenge=(.+)$/);
  return match ? decodeChallenge(match[1]) : null;
}
