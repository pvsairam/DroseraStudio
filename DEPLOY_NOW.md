# 🚀 Deploy Drosera Studio to Railway - FINAL FIX

## The Issue
`import.meta.dirname` is not available in bundled Node.js code, causing Railway deployment to crash.

## The Solution
Created a polyfill that gets automatically injected during the build process.

## Deploy Steps (2 Minutes)

### 1. Commit and Push
```bash
git add .
git commit -m "Fix: Add import.meta.dirname polyfill for Railway deployment"
git push
```

### 2. Railway Auto-Deploys
Railway will automatically:
- Detect the push
- Run the custom build script (`node scripts/build.js`)
- Inject the dirname polyfill
- Start your app successfully

### 3. Verify Deployment
Check Railway logs - you should see:
```
📦 Building frontend...
📦 Building backend...
✅ Build complete!
✓ API routes registered
✓ WebSocket server initialized
serving on port 5000
🚀 Initializing Drosera blockchain indexer...
```

### 4. Access Your App
Railway provides a URL like:
```
https://drosera-studio.up.railway.app
```

## Environment Variables (Don't Forget!)

In Railway Dashboard → Variables, add:

```env
DATABASE_URL=your_supabase_transaction_url
SESSION_SECRET=run: openssl rand -base64 32
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

**Important:** DATABASE_URL must use **Transaction mode** (port 6543), not Session mode!

Example:
```
postgresql://user:pass@host.supabase.co:6543/postgres?sslmode=require
```

## What Changed

### Files Created/Modified:
1. **`server/dirname-polyfill.js`** - Polyfill for `import.meta.dirname`
2. **`scripts/build.js`** - Custom build script that injects the polyfill
3. **`railway.json`** - Railway configuration

### How It Works:
- esbuild's `inject` option adds the polyfill to the bundle
- The polyfill defines `import.meta.dirname` before any code runs
- All path operations now work correctly in production

## Troubleshooting

### Still getting path errors?
1. Check that `server/dirname-polyfill.js` exists
2. Verify `scripts/build.js` has `inject: ['server/dirname-polyfill.js']`
3. Check Railway build logs - should show "✅ Build complete!"

### App won't start?
- **Database**: Verify DATABASE_URL uses port 6543 (Transaction mode)
- **Session**: Ensure SESSION_SECRET is set
- **Telegram**: Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID

### Build fails?
- Railway needs `esbuild` in dependencies (already installed)
- Check that `scripts/build.js` exists in your repo

## Success Checklist

- [ ] Committed all files
- [ ] Pushed to GitHub
- [ ] Railway auto-deployment started
- [ ] Build logs show "✅ Build complete!"
- [ ] App logs show "serving on port 5000"
- [ ] Environment variables are set
- [ ] App is accessible at Railway URL

## Next Steps

Once deployed:
1. Connect your wallet
2. Verify blockchain indexer is running
3. Check that events are being monitored
4. Test admin console access
5. Configure custom domain (optional)

---

**Ready?** Just run:
```bash
git add . && git commit -m "Fix Railway deployment" && git push
```

Railway will handle the rest! 🎉
