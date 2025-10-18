/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

type HttpError = { status: number; message: string } | null;

interface HttpContextType {
  error: HttpError;
  setHttpError: (err: HttpError) => void;
  clearHttpError: () => void;
}

const HttpContext = createContext<HttpContextType | undefined>(undefined);

export const useHttp = () => {
  const ctx = useContext(HttpContext);
  if (!ctx) throw new Error('useHttp must be used within HttpProvider');
  return ctx;
};

export const HttpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<HttpError>(null);
  const setHttpError = useCallback((err: HttpError) => setError(err), []);
  const clearHttpError = useCallback(() => setError(null), []);
  return (
    <HttpContext.Provider value={{ error, setHttpError, clearHttpError }}>
      {children}
    </HttpContext.Provider>
  );
};

export const ErrorBanner: React.FC = () => {
  const { error, clearHttpError } = useHttp();
  if (!error) return null;
  if (![401, 403, 404].includes(error.status)) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white px-4 py-3 shadow">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <p className="text-sm">
          Erreur {error.status} — {error.message}
        </p>
        <button onClick={clearHttpError} className="text-white/90 hover:text-white text-sm underline">Fermer</button>
      </div>
    </div>
  );
};
