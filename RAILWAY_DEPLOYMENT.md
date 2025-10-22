# Deploy Drosera Studio to Railway

Railway is perfect for Drosera Studio because it supports WebSockets, long-running processes, and background workers with zero code changes needed.

## Prerequisites

1. GitHub account
2. Railway account (sign up at [railway.app](https://railway.app))

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit - Drosera Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/drosera-studio.git
git push -u origin main
```

## Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `drosera-studio` repository
5. Railway will auto-detect your project and deploy!

## Step 3: Configure Environment Variables

In Railway dashboard, add these environment variables:

### Required Variables:
```
DATABASE_URL=your_supabase_connection_string
SESSION_SECRET=your_secret_key_here
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=your_chat_id
NODE_ENV=production
PORT=5000
```

### Get these values from:
- **DATABASE_URL**: Supabase Dashboard → Settings → Database → Connection String (Transaction mode, port 6543)
- **SESSION_SECRET**: Generate with `openssl rand -base64 32`
- **TELEGRAM_BOT_TOKEN**: From BotFather on Telegram
- **TELEGRAM_CHAT_ID**: Your Telegram chat ID

## Step 4: Configure Build & Start Commands

Railway should auto-detect these, but verify:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Install Command**: `npm install`

## Step 5: Deploy!

Click **"Deploy"** and Railway will:
1. Install dependencies
2. Build your app
3. Start the server
4. Give you a public URL (e.g., `drosera-studio.up.railway.app`)

## Features Included:

✅ Real-time WebSocket connections
✅ Blockchain indexer running continuously
✅ PostgreSQL database (Supabase)
✅ Wallet authentication
✅ Admin console
✅ Alert notifications (Telegram)
✅ Theme customization
✅ Configuration export

## Monitoring

- **Logs**: View in Railway dashboard
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Automatic on every git push

## Free Tier:

Railway provides **$5 free credit per month**, which is typically enough for:
- Small to medium traffic apps
- Development/staging environments
- Personal projects

## Troubleshooting

### Build fails?
Check build logs in Railway dashboard. Common issues:
- Missing environment variables
- Database connection errors

### App crashes on start?
- Verify `DATABASE_URL` is correct (Transaction mode, port 6543)
- Check `SESSION_SECRET` is set
- Review startup logs

### Can't connect to blockchain?
- Blockchain indexer starts automatically 2 seconds after server start
- Check logs for indexer messages

## Custom Domain (Optional)

Railway supports custom domains:
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records as instructed

---

**Need Help?** Check Railway documentation at [docs.railway.app](https://docs.railway.app)
