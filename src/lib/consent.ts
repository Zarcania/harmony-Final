import { ConsentCategory } from '../contexts/ConsentContext';

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type ConsentDecision = {
  state: ConsentState;
  savedAt: number;
  expiresAt: number;
};

const STORAGE_KEY = 'hc_consent_v1';

function readStoredDecision(): ConsentDecision | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentDecision;
    if (!parsed || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function runWhenConsented(category: ConsentCategory, fn: () => void, fallback?: () => void) {
  const stored = readStoredDecision();
  if (stored && stored.expiresAt > Date.now()) {
    if (category === 'necessary' || stored.state[category]) {
      fn();
      return;
    }
  }
  if (fallback) fallback();
}
