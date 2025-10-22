# Railway Deployment Fix

## Issue
The `import.meta.dirname` is undefined in the bundled production code, causing the app to crash.

## Solution
Created a custom build script (`scripts/build.js`) that properly handles ESM path resolution.

## Deploy to Railway

### Option 1: Redeploy with Fix (Recommended)

1. **Commit and push the fix:**
```bash
git add .
git commit -m "Fix: Handle import.meta.dirname in production build"
git push
```

2. **Railway will automatically redeploy** with the fixed build script

### Option 2: Manual Build Command

If you prefer not to use `railway.json`, set the build command manually in Railway dashboard:

**Build Command:**
```
node scripts/build.js
```

**Start Command:**
```
npm run start
```

## What Changed

- Created `scripts/build.js` - Custom build script that injects `__dirname` polyfill
- Updated `railway.json` - Uses new build command
- The fix ensures `import.meta.dirname` works in bundled production code

## Verify Deployment

After deploying, check logs in Railway dashboard. You should see:
```
✓ API routes registered
✓ WebSocket server initialized
serving on port 5000
✓ Menus already seeded, skipping...
🚀 Initializing Drosera blockchain indexer...
```

## Environment Variables

Make sure these are set in Railway:
- `DATABASE_URL`
- `SESSION_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `PORT` (automatically set by Railway)
- `NODE_ENV` (automatically set to "production")

## Troubleshooting

**Build fails?**
- Check that `scripts/build.js` exists in repository
- Verify esbuild is in dependencies (it is)

**Still getting path errors?**
- Check Railway logs for specific error
- Verify environment variables are set
- Ensure DATABASE_URL uses Transaction mode (port 6543)

**App starts but crashes?**
- Usually database connection issue
- Verify Supabase connection string
- Check that you're using Transaction mode, not Session mode
