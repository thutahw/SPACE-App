# 📋 Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variable templates created
- [ ] Deployment docs reviewed

## Render Setup

### Database
- [ ] PostgreSQL database created on Render
- [ ] Internal Database URL copied
- [ ] Database connection tested

### API Service
- [ ] Web service created on Render
- [ ] Repository connected
- [ ] Root directory set to `apps/api`
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables added:
  - [ ] DATABASE_URL
  - [ ] NODE_ENV=production
  - [ ] PORT=4000
  - [ ] JWT_SECRET (32+ chars)
  - [ ] JWT_EXPIRES_IN=7d
  - [ ] JWT_REFRESH_SECRET (32+ chars)
  - [ ] JWT_REFRESH_EXPIRES_IN=30d
  - [ ] FRONTEND_URL (will update later)
- [ ] First deployment completed
- [ ] API URL copied
- [ ] API health check passed (`/api` endpoint)

## Vercel Setup

- [ ] Vercel project created
- [ ] Repository connected
- [ ] Root directory set to `apps/web`
- [ ] Build command configured
- [ ] Environment variables added:
  - [ ] NEXT_PUBLIC_API_URL (from Render)
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (if using Stripe)
- [ ] First deployment completed
- [ ] Frontend URL copied
- [ ] App loads in browser

## Post-Deployment

- [ ] Updated FRONTEND_URL in Render with Vercel URL
- [ ] Waited for Render API to redeploy (~3 min)
- [ ] Tested user registration
- [ ] Tested user login
- [ ] Tested API connectivity from frontend
- [ ] Checked browser console for errors
- [ ] Verified CORS is working

## Optional Enhancements

- [ ] Custom domain added to Vercel
- [ ] Updated FRONTEND_URL with custom domain
- [ ] SSL certificate verified (automatic)
- [ ] Upgraded Render API to paid (no cold starts)
- [ ] Upgraded Render DB to paid (persistence + backups)
- [ ] Set up monitoring/alerts
- [ ] Configure analytics

## Troubleshooting Completed

- [ ] CORS errors resolved
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] WebSocket connections working (for messaging)
- [ ] File uploads working (if implemented)

## Documentation

- [ ] Updated README with live URLs
- [ ] Documented deployment process for team
- [ ] Saved environment variables securely
- [ ] Created backup of database credentials

---

## Quick Reference

**Database URL:** `<save-securely>`
**API URL:** `<your-render-url>`
**Frontend URL:** `<your-vercel-url>`
**JWT Secret:** `<saved-in-password-manager>`

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Status:** ⬜ In Progress | ⬜ Completed | ⬜ Issues
