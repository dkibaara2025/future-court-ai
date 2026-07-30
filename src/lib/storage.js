const KEY = 'future-court-demo-verdicts';

export function saveVerdict(item, storage = localStorage) {
  const current = loadVerdicts(storage);
  storage.setItem(KEY, JSON.stringify([item, ...current].slice(0, 20)));
}

export function loadVerdicts(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
