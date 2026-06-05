# 🌍 Complete Deployment Guide - Frontend + Backend

## Recommended Setup

```
┌─────────────────────────────────────────────┐
│     The Hackathon Simulator Monorepo        │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend                Backend            │
│  ────────────────────────────────────       │
│  Vercel                 Render              │
│  (Next.js)              (Express.js)        │
│  https://app...         https://api...      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Option A: Recommended (Vercel + Render)

### Pros
- ✅ Both have free tiers
- ✅ Easy auto-deployments
- ✅ Excellent for full-stack apps
- ✅ Good performance
- ✅ CORS friendly

### Cons
- ⚠️ 2 separate dashboards

---

## Option B: All on Vercel

### Pros
- ✅ Single dashboard
- ✅ One billing account
- ✅ Unified deployments

### Cons
- ❌ Backend must be serverless functions
- ⚠️ Cold starts on free tier
- ⚠️ Limited to Vercel's Node.js runtime

---

## Option C: All on Render

### Pros
- ✅ Single dashboard
- ✅ Traditional Node.js server (always warm)
- ✅ Easy to scale

### Cons
- ⚠️ Paid tier required for both
- ⚠️ Higher costs than Vercel

---

# 🎯 Setup Instructions - Option A (Recommended)

## Frontend on Vercel

### 1. Push to GitHub
```bash
cd hackathonproject
git add .
git commit -m "Deploy frontend to Vercel"
git push origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com/new
2. Import repository
3. Select root: `frontend`
4. Add environment variables
5. Deploy

**Environment Variables (Vercel):**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**Result:** `https://your-app.vercel.app`

---

## Backend on Render

### 1. Push to GitHub ✓ (Already done)

### 2. Deploy to Render
1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Configure:

**Build Command:**
```bash
cd backend && npm install
```

**Start Command:**
```bash
cd backend && npm start
```

**Environment Variables:**
```
OPENAI_API_KEY=your_key
GOOGLE_AI_KEY=your_key
OPENROUTER_API_KEY=your_key
FRONTEND_URL=https://your-app.vercel.app
```

**Result:** `https://your-backend.onrender.com`

---

# 📋 Complete Deployment Checklist

## Phase 1: Preparation ✅
- ✅ Code organized in monorepo
- ✅ Frontend ready (Next.js)
- ✅ Backend ready (Express.js)
- ✅ Environment variables templated
- ✅ GitHub repository created

## Phase 2: Frontend Deployment
- ⬜ Create Vercel account (https://vercel.com)
- ⬜ Connect GitHub
- ⬜ Import repository
- ⬜ Select root: `frontend`
- ⬜ Add NEXT_PUBLIC_API_URL
- ⬜ Deploy
- ⬜ Get Vercel URL: `https://app-name.vercel.app`

## Phase 3: Backend Deployment
- ⬜ Create Render account (https://render.com)
- ⬜ Connect GitHub
- ⬜ Create Web Service
- ⬜ Set build command: `cd backend && npm install`
- ⬜ Set start command: `cd backend && npm start`
- ⬜ Add environment variables
- ⬜ Deploy
- ⬜ Get Render URL: `https://app-backend.onrender.com`

## Phase 4: Integration
- ⬜ Update frontend `.env.production` with backend URL
- ⬜ Redeploy frontend to Vercel
- ⬜ Test API calls from frontend
- ⬜ Enable auto-deployment on both platforms

## Phase 5: Monitoring
- ⬜ Monitor Vercel logs
- ⬜ Monitor Render logs
- ⬜ Set up error tracking (optional)
- ⬜ Test all API endpoints

---

## Deployment Comparison Table

| Feature | Vercel | Render | Railway |
|---------|--------|--------|---------|
| **Free Tier** | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Node.js Support** | ✅ Functions | ✅ Web Service | ✅ Service |
| **Auto-Deploy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Custom Domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **SSL/TLS** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Scaling** | ✅ Good | ✅ Good | ✅ Good |
| **Cost for Backend** | $0 (Functions) | $7/mo | $5+/mo |
| **Ease of Use** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

# 🚀 Quick Deploy Commands

```bash
# 1. Prepare
cd C:\Users\pragy\Desktop\hackathonproject
git add .
git commit -m "Ready for production deployment"
git push origin main

# 2. Frontend: Go to https://vercel.com/new
#    - Import repository
#    - Select root: frontend
#    - Add environment variables
#    - Deploy

# 3. Backend: Go to https://render.com
#    - Create Web Service
#    - Connect GitHub
#    - Set commands and env vars
#    - Deploy

# 4. Update Frontend
#    - Add backend URL to frontend/.env.production
#    - Redeploy to Vercel
```

---

# 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | Vercel frontend deployment |
| `RENDER_DEPLOYMENT.md` | Render backend deployment |
| `MONOREPO_GUIDE.md` | Local development guide |
| `README.md` | Project overview |

---

# 🎯 URLs After Deployment

```
Frontend:  https://your-app.vercel.app
Backend:   https://your-backend.onrender.com
```

---

# ✨ Environment Variables Summary

### Frontend (`frontend/.env.production`)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend (`backend/.env` on Render)
```
PORT=5000
NODE_ENV=production
OPENAI_API_KEY=your_key
GOOGLE_AI_KEY=your_key
OPENROUTER_API_KEY=your_key
FRONTEND_URL=https://your-app.vercel.app
```

---

# 🔄 Auto-Deployment Setup

Both Vercel and Render automatically redeploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your message"
git push origin main

# ✅ Automatic deployment triggered!
# Monitor at:
# - Vercel: https://vercel.com/dashboard
# - Render: https://dashboard.render.com
```

---

# 📊 Estimated Costs (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Vercel Frontend | Free/Pro | $0-20 |
| Render Backend | Free/Starter | $0-7 |
| **Total** | | **$0-27/month** |

---

# ⚠️ Important Reminders

1. **Keep Secrets Safe** - Never commit `.env.local`
2. **Update CORS** - Backend must know frontend URL
3. **API Keys** - Add them only in deployment platform, never in code
4. **Monitor Logs** - Check for errors after deployment
5. **Test Endpoints** - Verify all APIs work after deployment

---

# ✅ Success Checklist

After deployment, verify:

- ✅ Frontend loads at Vercel URL
- ✅ Backend health check: `https://backend/api/health`
- ✅ API calls work from frontend
- ✅ No CORS errors in console
- ✅ Environment variables set correctly
- ✅ Auto-deployment enabled on both platforms

---

**Deployment Status**: 🟢 Ready
**Recommended Setup**: Vercel (Frontend) + Render (Backend)
**Setup Time**: 20-30 minutes
**Total Cost**: $0-7/month (with free tiers)
