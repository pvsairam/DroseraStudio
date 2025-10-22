// Polyfill for import.meta.dirname in bundled ESM code
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// This gets injected at the top of every file during bundling
export const __dirname_polyfill = (() => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    return dirname(__filename);
  } catch (e) {
    // Fallback for edge cases
    return process.cwd();
  }
})();

// Polyfill import.meta.dirname if it doesn't exist
if (typeof import.meta.dirname === 'undefined') {
  Object.defineProperty(import.meta, 'dirname', {
    get() {
      return __dirname_polyfill;
    }
  });
}
