/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

type ConsentState = {
  // always true for necessary
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type ConsentDecision = {
  state: ConsentState;
  // Unix ms when saved
  savedAt: number;
  // Unix ms when it expires (CNIL recommande 6 mois)
  expiresAt: number;
};

type ConsentContextValue = {
  consent: ConsentState | null; // null => pas encore décidé
  showPreferences: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  refuseAll: () => void;
  savePreferences: (partial: Omit<ConsentState, 'necessary'>) => void;
  isConsented: (category: ConsentCategory) => boolean;
};

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

const STORAGE_KEY = 'hc_consent_v1';
// 6 mois en ms
const SIX_MONTHS = 1000 * 60 * 60 * 24 * 30 * 6;

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

function writeDecision(state: ConsentState) {
  const now = Date.now();
  const decision: ConsentDecision = {
    state,
    savedAt: now,
    expiresAt: now + SIX_MONTHS,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decision));
  } catch {
    // noop
  }
}

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  // Charger initial depuis storage
  useEffect(() => {
    const stored = readStoredDecision();
    if (stored && stored.expiresAt > Date.now()) {
      setConsent(stored.state);
    } else {
      // expiré ou absent => redemander consentement
      setConsent(null);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: true, marketing: true };
    setConsent(next);
    writeDecision(next);
    setShowPreferences(false);
  }, []);

  const refuseAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: false, marketing: false };
    setConsent(next);
    writeDecision(next);
    setShowPreferences(false);
  }, []);

  const savePreferences = useCallback((partial: Omit<ConsentState, 'necessary'>) => {
    const next: ConsentState = { necessary: true, analytics: !!partial.analytics, marketing: !!partial.marketing };
    setConsent(next);
    writeDecision(next);
    setShowPreferences(false);
  }, []);

  const openPreferences = useCallback(() => setShowPreferences(true), []);
  const closePreferences = useCallback(() => setShowPreferences(false), []);

  const isConsented = useCallback(
    (category: ConsentCategory) => {
      if (category === 'necessary') return true;
      return !!consent?.[category];
    },
    [consent]
  );

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, showPreferences, openPreferences, closePreferences, acceptAll, refuseAll, savePreferences, isConsented }),
    [consent, showPreferences, openPreferences, closePreferences, acceptAll, refuseAll, savePreferences, isConsented]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export function useConsentContext(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsentContext must be used within ConsentProvider');
  return ctx;
}

