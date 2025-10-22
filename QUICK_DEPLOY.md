# Quick Deploy Guide - Drosera Studio

## 🚀 Deploy to Railway in 5 Minutes

### Step 1: Create GitHub Repository
```bash
git init
git add .
git commit -m "Ready for deployment"
```

Create a new repository on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/drosera-studio.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Visit [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `drosera-studio` repository
4. Railway will automatically detect and deploy your app!

### Step 3: Add Environment Variables

Click on your deployed project → **Variables** tab → Add:

```
DATABASE_URL = your_supabase_transaction_mode_url
SESSION_SECRET = run: openssl rand -base64 32
TELEGRAM_BOT_TOKEN = your_telegram_bot_token
TELEGRAM_CHAT_ID = your_telegram_chat_id
```

**Get DATABASE_URL from Supabase:**
- Go to Supabase Dashboard → Settings → Database
- Copy "Transaction" mode connection string (port 6543)
- Format: `postgresql://user:pass@host:6543/db?sslmode=require`

### Step 4: Access Your App

Railway will give you a URL like:
```
https://drosera-studio.up.railway.app
```

## ✅ What's Included:

- Real-time trap event monitoring
- Wallet authentication (MetaMask, WalletConnect)
- Admin console with RBAC
- Telegram notifications
- Theme customization
- Configuration export/import
- Live blockchain indexer

## 💰 Pricing

**Free Tier:** $5 credit/month (renews monthly)
- Plenty for development and small projects
- Upgrade only if you need more resources

## 🔧 Troubleshooting

**Build fails?**
- Check that all dependencies are in package.json
- Review build logs in Railway dashboard

**App won't start?**
- Verify DATABASE_URL is correct (Transaction mode, port 6543)
- Ensure SESSION_SECRET is set
- Check runtime logs for errors

**Database connection issues?**
- Use Supabase Transaction mode (port 6543, not 5432)
- Verify connection pooling is enabled
- Check Supabase firewall settings

## 📊 Monitor Your App

Railway provides:
- Real-time logs
- CPU & memory metrics
- Deployment history
- Automatic HTTPS

## 🎯 Next Steps

1. **Custom Domain**: Settings → Domains → Add custom domain
2. **Scaling**: Upgrade plan if needed (starts at $5/month usage-based)
3. **Database**: Consider Railway's PostgreSQL if moving from Supabase

---

**Questions?** Check [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed guide.
