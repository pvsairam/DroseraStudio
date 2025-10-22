# Deployment Guide

This guide provides step-by-step instructions for deploying Drosera Studio to GitHub and Vercel.

## Prerequisites

- Git installed on your local machine
- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Neon, Supabase, or similar)

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Drosera Studio blockchain monitoring dashboard"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `drosera-studio`)
3. Do NOT initialize with README (we already have one)

### 1.3 Connect Local Repository to GitHub

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 1.4 Verify Push

Go to your GitHub repository URL and verify all files are uploaded.

## Step 2: Use Your Existing Supabase Database

You're already using Supabase, so you just need to get your connection details:

### Get Supabase Connection String

1. **Go to your Supabase project dashboard**
2. **Navigate to**: Settings > Database
3. **Copy the Connection String**:
   - Set connection mode to "Transaction" (not Session)
   - Use the "Connection string" format
   - It should look like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

4. **Also copy individual credentials** (for PGHOST, PGUSER, etc.):
   - Host: `aws-0-[region].pooler.supabase.com`
   - Port: `6543` (for Transaction mode) or `5432` (for Session mode)
   - Database: `postgres`
   - User: `postgres.[ref]`
   - Password: Your database password

### Important Supabase Notes

- ✅ Use **Transaction mode** (port 6543) for Vercel serverless functions
- ✅ Your Supabase project already has all tables created
- ✅ Connection pooling is handled automatically by Supabase

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 3.2 Deploy Using Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New..." > "Project"

2. **Import GitHub Repository**
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub account
   - Select your `drosera-studio` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Select "Other"
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev`

4. **Add Environment Variables**
   
   Click "Environment Variables" and add the following:

   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   PGHOST=your-postgres-host
   PGPORT=5432
   PGUSER=your-postgres-user
   PGPASSWORD=your-postgres-password
   PGDATABASE=your-database-name
   SESSION_SECRET=your-random-session-secret-min-32-chars
   ```

   Optional (for alert notifications):
   ```
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)

### 3.3 Deploy Using Vercel CLI

Alternatively, deploy from command line:

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts to configure your project
```

## Step 4: Post-Deployment Configuration

### 4.1 Initialize Database

After the first deployment, run database migrations:

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Link to your project
vercel link

# Run database push
vercel env pull .env.production
npm run db:push
```

Or connect to your database directly and run:

```sql
-- Drizzle will auto-create tables on first API call
-- But you can manually trigger it by visiting:
-- https://your-app.vercel.app/api/dashboard/stats
```

### 4.2 Seed Initial Data (Optional)

You can run the seed script locally against your production database:

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="your-production-database-url"

# Run seed script
npm run seed
```

### 4.3 Create Master Admin

Connect to your production database and add yourself as master admin:

```sql
INSERT INTO admin_whitelist (wallet_address, role, created_at)
VALUES ('0xYourWalletAddress', 'master_admin', NOW());
```

## Step 5: Verify Deployment

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Connect your wallet** on the landing page
3. **Verify authentication** works
4. **Access Admin Console** (if you're a master admin)
5. **Check real-time data** on the dashboard
6. **Test WebSocket connection** (events should stream in real-time)

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically build and deploy the new version.

## Troubleshooting

### Build Fails

1. Check Vercel build logs for errors
2. Verify all environment variables are set
3. Make sure `package.json` has all dependencies listed
4. Try running `npm run build` locally first

### Database Connection Errors

1. Verify `DATABASE_URL` is correctly formatted
2. Check database firewall rules (whitelist Vercel IP ranges)
3. Ensure database is accessible from Vercel's servers
4. Test connection string locally first

### Environment Variables Not Working

1. Make sure variables are added in Vercel dashboard
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)
4. For frontend variables, prefix with `VITE_`

### WebSocket Not Working

1. WebSocket connections work differently on serverless platforms
2. Consider using Vercel's Edge Functions or upgrade to Pro plan
3. Alternative: Deploy backend separately (Railway, Render, etc.)

## Alternative Deployment: Railway

If Vercel doesn't meet your needs (especially for WebSockets), consider Railway:

1. **Go to Railway**: https://railway.app
2. **New Project** > **Deploy from GitHub repo**
3. **Select your repository**
4. **Add PostgreSQL database** (Railway provides one-click setup)
5. **Set environment variables** (Railway auto-configures DATABASE_URL)
6. **Deploy**

Railway supports long-running connections and WebSockets out of the box.

## Custom Domain

### On Vercel

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued

### DNS Configuration

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Monitoring and Logs

- **Vercel Dashboard**: View real-time logs and analytics
- **Database Logs**: Check your PostgreSQL provider's dashboard
- **Error Tracking**: Consider adding Sentry for error monitoring

## Security Considerations

1. **Never commit `.env` file** (already in .gitignore)
2. **Rotate SESSION_SECRET regularly**
3. **Use strong database passwords**
4. **Enable SSL for database connections**
5. **Review Vercel security settings**
6. **Set up CORS properly** for production domain

## Scaling

- **Vercel Pro**: For higher limits and better performance
- **Database**: Upgrade to paid tier as data grows
- **Caching**: Add Redis for better performance
- **CDN**: Vercel includes global CDN automatically

---

## Quick Deploy Commands

For your reference, here are the commands in sequence:

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main

# 2. Deploy to Vercel (CLI method)
npm install -g vercel
vercel login
vercel --prod

# 3. After deployment, initialize database
vercel env pull .env.production
npm run db:push

# 4. (Optional) Seed initial data
npm run seed
```

**That's it!** Your Drosera Studio dashboard should now be live and accessible worldwide.

---

For support, open an issue on GitHub or contact operator@drosera.io
