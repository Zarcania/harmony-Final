import '@testing-library/jest-dom/vitest';

// Silence console noise from components during tests if needed
// but keep warnings useful.
const origError: (...args: unknown[]) => void = console.error as unknown as (...args: unknown[]) => void;
console.error = (...args: unknown[]) => {
  // filter react act warnings if they get noisy; can be tuned later
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  origError(...args);
};
