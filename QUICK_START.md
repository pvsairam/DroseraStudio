# Quick Start - GitHub & Vercel Deployment

## Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Drosera Studio"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Deploy to Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. Visit https://vercel.com/dashboard
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Configure:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add environment variables (see below)
6. Click "Deploy"

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Required Environment Variables

Add these in Vercel dashboard under "Environment Variables":

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-postgres-user
PGPASSWORD=your-postgres-password
PGDATABASE=your-database-name
SESSION_SECRET=your-random-session-secret-min-32-chars
```

Optional (for alerts):
```bash
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

## Database Setup

You're already using **Supabase** - just get your connection details:

1. Go to your Supabase project > Settings > Database
2. Copy the connection string (use "Transaction" mode)
3. Copy individual credentials (host, port, user, password)
4. Add them to Vercel environment variables

### Initialize Database

After deployment, your database tables will be auto-created on first API call.

To create a master admin:
```sql
INSERT INTO admin_whitelist (wallet_address, role, created_at)
VALUES ('0xYourWalletAddress', 'master_admin', NOW());
```

## Verify Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Connect your wallet
3. Verify dashboard loads with real-time data

## Common Issues

**Build fails**: Check environment variables are set
**Database errors**: Verify DATABASE_URL is correct
**Theme not loading**: Fixed! ✓

## Next Steps

1. **Push to GitHub** using commands above
2. **Create PostgreSQL database** on Neon
3. **Deploy to Vercel** via dashboard
4. **Add environment variables** in Vercel settings
5. **Create master admin** in database
6. **Visit your live site!**

For detailed instructions, see `DEPLOYMENT.md` and `README.md`

---

© 2025 Drosera Studio
