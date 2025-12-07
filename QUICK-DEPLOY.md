# 🚀 Quick Deployment Guide

Follow these steps to deploy your app to Vercel + Render in ~15 minutes.

## ✅ Step 1: Push Code to GitHub (If not already done)

```bash
# Add deployment files
git add DEPLOYMENT.md QUICK-DEPLOY.md
git add apps/api/.env.production.example apps/api/render.yaml
git add apps/web/.env.production.example
git add vercel.json

# Commit changes
git commit -m "Add deployment configuration for Vercel and Render"

# Push to GitHub
git push origin branch-test-thuta
```

## 🗄️ Step 2: Deploy Database on Render (2 minutes)

1. Go to https://dashboard.render.com/
2. Sign up/login with GitHub
3. Click **"New +"** → **"PostgreSQL"**
4. Fill in:
   - Name: `space-app-db`
   - Database: `space_app`
   - User: `space_app_user`
   - Region: `Oregon` (or closest to you)
   - Plan: **Free** (or Starter $7/mo)
5. Click **"Create Database"**
6. **COPY THE "Internal Database URL"** - you'll need this!

## 🔧 Step 3: Deploy API on Render (5 minutes)

1. Still in Render, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if asked
3. Select your `SPACE-App` repository
4. Fill in:
   - **Name:** `space-app-api`
   - **Region:** Same as database (Oregon)
   - **Branch:** `branch-test-thuta` (or main)
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Build Command:**
     ```
     npx pnpm@9.0.0 install && npm run build && npx prisma generate && npx prisma db push
     ```
   - **Start Command:**
     ```
     npm run start:prod
     ```
   - **Plan:** Free (or Starter $7/mo)

5. Click **"Advanced"** and add these environment variables:

```
DATABASE_URL = <paste-internal-database-url-from-step-2>
NODE_ENV = production
PORT = 4000
JWT_SECRET = <generate-random-32-chars>
JWT_EXPIRES_IN = 7d
JWT_REFRESH_SECRET = <generate-different-32-chars>
JWT_REFRESH_EXPIRES_IN = 30d
FRONTEND_URL = https://your-app.vercel.app
```

**To generate secrets, run in terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. **COPY YOUR API URL** (e.g., `https://space-app-api.onrender.com`)

## 🌐 Step 4: Deploy Frontend on Vercel (3 minutes)

1. Go to https://vercel.com/
2. Sign up/login with GitHub
3. Click **"Add New..."** → **"Project"**
4. Select your `SPACE-App` repository
5. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** Click "Edit" → Select `apps/web`
   - **Build Command:** (leave default or use):
     ```
     cd ../.. && npx pnpm@9.0.0 install && cd apps/web && npm run build
     ```
   - **Output Directory:** `.next`
   - **Install Command:**
     ```
     npx pnpm@9.0.0 install
     ```

6. Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL = <your-render-api-url-from-step-3>
```

Example: `https://space-app-api.onrender.com`

7. Click **"Deploy"**
8. Wait 2-5 minutes
9. **COPY YOUR VERCEL URL** (e.g., `https://space-app-abc123.vercel.app`)

## 🔄 Step 5: Update Backend with Frontend URL

1. Go back to Render dashboard
2. Find your `space-app-api` service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` with your Vercel URL from step 4
5. Save (it will auto-redeploy, takes ~3 minutes)

## ✅ Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try to register/login
3. Check if everything works!

### If you see CORS errors:
- Make sure `FRONTEND_URL` in Render exactly matches your Vercel URL (including https://)
- No trailing slash at the end

### If API doesn't respond (free tier):
- First request takes ~30 seconds (cold start)
- After 15 min inactivity, it sleeps again

## 💡 Pro Tips

### Custom Domain (Optional)
1. In Vercel: Settings → Domains → Add your domain
2. Update `FRONTEND_URL` in Render to your custom domain

### Upgrade for Production
- **Render API:** $7/mo = no cold starts, faster
- **Render DB:** $7/mo = persistent, daily backups
- **Total:** $14/mo for reliable production

### Environment Variables
- Never commit `.env` files!
- Update secrets in dashboard, not in code
- Use different secrets for production!

## 🆘 Need Help?

Check the detailed guide: `DEPLOYMENT.md`

## 📝 What You Created

✅ PostgreSQL database on Render
✅ NestJS API on Render
✅ Next.js frontend on Vercel
✅ Automatic deployments on git push

**Total Time:** ~15 minutes
**Total Cost:** $0 (free tier) or $14/mo (production)

---

🎉 **Congratulations! Your app is live!** 🎉
