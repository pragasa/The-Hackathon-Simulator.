# 🚀 Backend Deployment Guide - Render

## Yes! Backend Can Be Hosted on Render ✅

**Render** is an excellent platform for hosting Node.js Express applications. It's simple, modern, and has a generous free tier.

---

## Why Render for Backend?

| Feature | Status |
|---------|--------|
| Node.js Support | ✅ Native support |
| Auto Deployments | ✅ From Git |
| Environment Variables | ✅ Full support |
| Free Tier | ✅ Available |
| Scaling | ✅ Easy vertical scaling |
| Custom Domain | ✅ Included |
| SSL/TLS | ✅ Automatic |
| Database Integration | ✅ PostgreSQL, MySQL, Redis |

---

## Prerequisites

1. ✅ GitHub account (repo must be pushed)
2. ✅ Render account (free at https://render.com)
3. ✅ Backend code ready (✓ Done)
4. ✅ Environment variables configured

---

## Step 1: Prepare Backend for Render

### Check `backend/package.json`

Ensure these scripts exist:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

✅ Already configured!

### Check Port Configuration

Render provides `PORT` environment variable. Your `server.js` should use it:

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

✅ Already configured!

---

## Step 2: Push Backend to GitHub

```bash
cd C:\Users\pragy\Desktop\hackathonproject

# Add all files
git add .

# Commit
git commit -m "Organize backend and frontend for monorepo deployment"

# Push to GitHub
git push origin main
```

---

## Step 3: Create Render Web Service

### 3.1 Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**

### 3.2 Connect GitHub Repository
1. Select **"Build and deploy from a Git repository"**
2. Click **"Connect"** next to your repository
3. Search for your repo
4. Click **"Connect"**

### 3.3 Configure Web Service

**Basic Settings:**

| Field | Value |
|-------|-------|
| Name | `hackathon-simulator-backend` |
| Environment | `Node` |
| Region | Choose closest to users |
| Branch | `main` |
| Build Command | `cd backend && npm install && npm run build` |
| Start Command | `cd backend && npm start` |
| Instance Type | `Free` (for testing) or `Starter` ($7/month) |

**Important: Build & Start Commands**

Since backend is in subdirectory, use:

```bash
# Build Command
cd backend && npm install

# Start Command
cd backend && npm start
```

### 3.4 Environment Variables

Click **"Environment"** tab and add:

```
PORT=5000
NODE_ENV=production
OPENAI_API_KEY=your_key_here
GOOGLE_AI_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
FRONTEND_URL=https://your-frontend.vercel.app
```

**IMPORTANT:** Update `FRONTEND_URL` to your actual frontend URL (Vercel)

### 3.5 Deploy

Click **"Create Web Service"** and wait for deployment (2-5 minutes).

Once deployed, you'll get a URL like: `https://hackathon-simulator-backend.onrender.com`

---

## Step 4: Update Frontend to Use Render Backend

### 4.1 Update `frontend/.env.production`

```
NEXT_PUBLIC_API_URL=https://hackathon-simulator-backend.onrender.com
```

### 4.2 Update `frontend/.env.local` (for local testing)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4.3 Rebuild & Deploy Frontend

```bash
cd frontend
npm run build
```

Then redeploy to Vercel or run: `npm start`

---

## Step 5: Test Backend on Render

### Test Health Endpoint

```bash
curl https://hackathon-simulator-backend.onrender.com/health
```

Expected response:
```json
{ "status": "Backend is running" }
```

### Test API Endpoint

```bash
curl -X POST https://hackathon-simulator-backend.onrender.com/api/generate-prd \
  -H "Content-Type: application/json" \
  -d '{"idea":"AI chatbot"}'
```

---

## Deployment Architecture

```
┌─────────────────────────┐
│   Vercel (Frontend)     │
│  https://your-app...    │
│   (Next.js Port 3000)   │
└────────────┬────────────┘
             │
             │ API calls
             │ (CORS enabled)
             ▼
┌─────────────────────────┐
│   Render (Backend)      │
│  https://...onrender.com│
│  (Express Port 5000)    │
└─────────────────────────┘
```

---

## Monitoring & Logs

### View Logs
1. Go to Render dashboard
2. Select your service
3. Click **"Logs"** tab
4. Monitor real-time logs

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Ensure `cd backend` in build command |
| Port errors | Render sets `PORT` env var automatically |
| CORS errors | Update `FRONTEND_URL` in backend `.env` |
| API 404 | Check routes in `backend/routes/index.js` |

---

## Cost Comparison

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Render** | ✅ Yes | $7/month (Starter) |
| **Vercel** | ✅ Yes | $20+/month (Pro) |
| **Heroku** | ❌ No | $7/month |
| **Railway** | ❌ No | Pay-as-you-go |

---

## Auto-Deployment Setup

### Enable Auto-Deploy from GitHub

1. In Render dashboard, go to your service
2. **Settings** → **GitHub** → **Auto-Deploy**
3. Choose deployment trigger:
   - Push to main branch
   - Pull request merges

Now every `git push` to main automatically redeploys!

```bash
git add .
git commit -m "Update backend"
git push origin main
# Render automatically deploys! 🚀
```

---

## Environment Variables Reference

**Required for Production:**
```
OPENAI_API_KEY=sk-...
GOOGLE_AI_KEY=...
OPENROUTER_API_KEY=...
FRONTEND_URL=https://your-frontend.vercel.app
PORT=5000 (auto-set by Render)
NODE_ENV=production
```

---

## Full Deployment Checklist

- ✅ Backend code ready
- ✅ GitHub repository synced
- ⬜ Create Render account
- ⬜ Connect GitHub to Render
- ⬜ Create Web Service
- ⬜ Set environment variables
- ⬜ Deploy
- ⬜ Get Render URL
- ⬜ Update frontend `.env.production`
- ⬜ Test API endpoints
- ⬜ Redeploy frontend

---

## Quick Reference Commands

```bash
# Test locally
cd backend
npm install
npm run dev

# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# View Render logs
# (Via dashboard at https://dashboard.render.com)

# Get backend URL
# Example: https://hackathon-simulator-backend.onrender.com
```

---

## Need Help?

### Render Documentation
- https://render.com/docs
- https://render.com/docs/deploy-node-express-app

### Common Issues & Fixes
- **Build fails**: Check `package.json` scripts
- **Service crashes**: Check logs in Render dashboard
- **CORS errors**: Update `FRONTEND_URL` in backend
- **Port issues**: Render auto-sets `PORT` env var

---

## Next Steps

1. **Create Render Account** → https://render.com
2. **Connect GitHub Repository**
3. **Deploy Backend**
4. **Get Backend URL**
5. **Update Frontend URL**
6. **Redeploy Frontend to Vercel**

---

**Status**: ✅ Backend Ready for Render Deployment
**Estimated Setup Time**: 10-15 minutes
**Cost**: Free tier available ($7/month for better performance)
