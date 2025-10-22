import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent for ESM in both development and production
const getDir = () => {
  // In production (bundled), import.meta.url will be the bundle location
  // In development, it will be the actual file location
  const filename = fileURLToPath(import.meta.url);
  return dirname(filename);
};

export const __dirname = getDir();

// Helper to resolve paths relative to the project root
export const resolveFromRoot = (...paths: string[]) => {
  // In production, __dirname will be 'dist', so we need to go up one level
  const isProduction = process.env.NODE_ENV === 'production';
  const root = isProduction ? resolve(__dirname, '..') : resolve(__dirname, '..');
  return resolve(root, ...paths);
};

// Helper to resolve paths relative to server directory
export const resolveFromServer = (...paths: string[]) => {
  return resolve(__dirname, ...paths);
};
