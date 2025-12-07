# Deployment Guide: Vercel + Render

This guide will help you deploy SPACE-App to Vercel (frontend) and Render (backend + database).

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)
- Render account (sign up at render.com)
- Your code pushed to GitHub

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `space-app-db`
   - **Database:** `space_app`
   - **User:** `space_app_user`
   - **Region:** Choose closest to your users
   - **Plan:** Free (expires after 90 days) or Starter ($7/mo for persistence)
4. Click **"Create Database"**
5. **Save the connection details** (you'll need the "Internal Database URL")

### Step 2: Create Web Service for API

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `space-app-api`
   - **Region:** Same as database
   - **Branch:** `main` (or your deployment branch)
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Build Command:** `npx pnpm@9.0.0 install && npx pnpm@9.0.0 run build && npx prisma generate && npx prisma db push`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Free or Starter ($7/mo for no cold starts)

4. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

```env
DATABASE_URL=<paste-internal-database-url-from-step-1>
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate-random-32-char-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate-different-random-32-char-string>
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-app.vercel.app
```

**To generate secure secrets, run this in your terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click **"Create Web Service"**
6. Wait for deployment (5-10 minutes)
7. **Copy your API URL** (e.g., `https://space-app-api.onrender.com`)

### Step 3: Verify API is Running

Once deployed, visit: `https://your-api-url.onrender.com/api`

You should see a response (may take 30s on first load if using free tier).

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && npx pnpm@9.0.0 install && cd apps/web && npx pnpm@9.0.0 run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npx pnpm@9.0.0 install`

### Step 2: Add Environment Variables

In Vercel project settings → Environment Variables, add:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com
```

If using Stripe:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes
3. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

### Step 4: Update Backend with Frontend URL

1. Go back to Render dashboard
2. Open your API service
3. Update the `FRONTEND_URL` environment variable with your Vercel URL
4. The service will auto-redeploy

---

## ✅ Part 3: Verify Deployment

### Test Frontend
Visit your Vercel URL: `https://your-app.vercel.app`

### Test API Connection
1. Open browser DevTools (F12) → Network tab
2. Try to register/login
3. Check if API calls are reaching your Render backend

### Common Issues

**CORS Errors:**
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check CORS configuration in `apps/api/src/main.ts`

**API Not Responding:**
- Free tier has cold starts (30s first load after 15min inactivity)
- Check Render logs for errors
- Verify DATABASE_URL is set correctly

**Database Connection Failed:**
- Make sure you used the "Internal Database URL" from Render
- Run migrations: `npx prisma db push` (should run in build command)

---

## 🔄 Continuous Deployment

Both Vercel and Render are now connected to your GitHub repo:

- **Push to `main` branch** → Auto-deploys to production
- **Create PR** → Vercel creates preview deployment
- **Environment variables** → Update in dashboard, not in code

---

## 💰 Cost Breakdown

### Free Tier (for testing):
- **Vercel:** Free (hobby plan)
- **Render Web Service:** Free (with cold starts)
- **Render PostgreSQL:** Free for 90 days
- **Total:** $0/month (with limitations)

### Recommended Production:
- **Vercel:** Free (hobby) or $20/mo (Pro)
- **Render Web Service:** $7/mo (no cold starts)
- **Render PostgreSQL:** $7/mo (persistent, daily backups)
- **Total:** $14/month

---

## 🛠️ Useful Commands

### View Render Logs:
```bash
# In Render dashboard → Your service → Logs tab
```

### Re-run Database Migrations:
```bash
# In Render dashboard → Your API service → Shell tab
npx prisma db push
```

### Rollback Deployment:
```bash
# In Vercel: Deployments → Select previous → "Promote to Production"
# In Render: Dashboard → Select deployment → "Rollback"
```

---

## 🔐 Security Checklist

- [ ] Change all default secrets (JWT_SECRET, etc.)
- [ ] Use strong database password (auto-generated by Render)
- [ ] Add your Vercel domain to Render CORS whitelist
- [ ] Enable environment variable encryption (automatic on Render/Vercel)
- [ ] Use HTTPS only (automatic on both platforms)
- [ ] Set up Vercel domain (optional: custom domain)

---

## 📚 Next Steps

1. **Custom Domain:** Add your domain in Vercel settings
2. **Database Backups:** Upgrade Render Postgres to paid for daily backups
3. **Monitoring:** Set up Render alerts for downtime
4. **Analytics:** Add Vercel Analytics (free)
5. **Staging Environment:** Create separate Render services for staging

---

## 🆘 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Prisma Deployment:** https://www.prisma.io/docs/guides/deployment

---

## 📝 Environment Variables Summary

### Render (API):
```
DATABASE_URL=<from-render-postgres>
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate-32-chars>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate-32-chars>
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=<your-vercel-url>
```

### Vercel (Frontend):
```
NEXT_PUBLIC_API_URL=<your-render-api-url>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<optional>
```

---

Good luck with your deployment! 🚀
