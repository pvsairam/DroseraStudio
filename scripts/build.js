import { build } from 'esbuild';
import { execSync } from 'child_process';

// First, build the frontend with Vite
console.log('📦 Building frontend...');
execSync('vite build', { stdio: 'inherit' });

// Then, build the backend with esbuild
console.log('📦 Building backend...');
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  inject: ['server/dirname-polyfill.js'],
});

console.log('✅ Build complete!');
