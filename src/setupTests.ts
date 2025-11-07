import '@testing-library/jest-dom/vitest';

// Silence console noise from components during tests if needed
// but keep warnings useful.
const origError: (...args: unknown[]) => void = console.error as unknown as (...args: unknown[]) => void;
console.error = (...args: unknown[]) => {
  // filter react act warnings if they get noisy; can be tuned later
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  origError(...args);
};

// Provide minimal env for modules using Supabase client during tests
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test_anon_key';
