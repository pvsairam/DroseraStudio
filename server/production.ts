// Production entry point that handles path resolution for bundled code
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Polyfill import.meta.dirname for bundled code
if (typeof (import.meta as any).dirname === 'undefined') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  (import.meta as any).dirname = __dirname;
}

// Now import the actual server
import('./index.js');
