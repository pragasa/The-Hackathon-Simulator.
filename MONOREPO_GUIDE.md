# 📦 Monorepo Organization Guide

## Directory Structure Overview

```
hackathonproject/
├── frontend/                 # Next.js React Application
│   ├── app/                 # Next.js pages and API routes
│   ├── components/          # React components
│   ├── public/              # Static assets
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript type definitions
│   ├── lib/                 # Utility functions & helpers
│   ├── data/                # Static data files
│   ├── .next/               # Build output (production)
│   ├── node_modules/        # Frontend dependencies
│   ├── package.json         # Frontend npm scripts
│   ├── tsconfig.json        # TypeScript config
│   ├── next.config.ts       # Next.js configuration
│   ├── eslint.config.mjs    # ESLint rules
│   ├── postcss.config.mjs   # PostCSS config
│   ├── components.json      # Shadcn UI components
│   ├── .gitignore           # Frontend-specific ignore rules
│   ├── .env.example         # Environment variables template
│   └── README.md            # Frontend documentation
│
├── backend/                  # Node.js Express API
│   ├── api/                 # API endpoint handlers
│   ├── routes/              # Express route definitions
│   ├── models/              # Data models & schemas
│   ├── middleware/          # Custom Express middleware
│   ├── config/              # Configuration files
│   ├── utils/               # Utility functions
│   ├── server.js            # Main Express server
│   ├── package.json         # Backend npm scripts
│   ├── .env.example         # Environment variables template
│   ├── .gitignore           # Backend-specific ignore rules
│   └── README.md            # Backend documentation
│
├── DEPLOYMENT.md            # Vercel deployment guide
├── README.md                # Main project README
├── package.json             # Root monorepo configuration
├── package-lock.json        # Root dependency lock file
├── vercel.json              # Vercel deployment config
├── .env.example             # Root environment template
├── .gitignore               # Global git ignore rules
└── .git/                    # Git repository
```

## File Organization

### Frontend (`/frontend`)
- **Dependencies**: npm packages for React, Next.js, TypeScript
- **Build Output**: `.next/` directory contains compiled code
- **Node Modules**: `frontend/node_modules/` (isolated)
- **Configuration**: All Next.js and TypeScript configs
- **Environment**: `frontend/.env.local` (create from `.env.example`)

### Backend (`/backend`)
- **Dependencies**: npm packages for Express, Node.js utilities
- **Server**: Runs independently on port 5000
- **Node Modules**: `backend/node_modules/` (isolated)
- **Environment**: `backend/.env.local` (create from `.env.example`)

### Root (`/`)
- **Monorepo Coordination**: Package management files
- **Documentation**: Deployment guides
- **Shared**: Root-level configs and git setup

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd hackathonproject

# Install frontend
cd frontend
npm install
cp .env.example .env.local
# Fill in required environment variables

# Install backend
cd ../backend
npm install
cp .env.example .env.local
# Fill in required environment variables
```

### Running Both Services

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm run dev  # or use process manager like PM2
```

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (`backend/.env.local`)
```
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_key_here
GOOGLE_AI_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
```

## Deployment

### Frontend (Vercel)
- See `DEPLOYMENT.md` for detailed instructions
- Deploy `frontend/` directory or entire repo
- Vercel auto-detects Next.js

### Backend (Multiple Options)
1. **Vercel Functions** - Convert to serverless
2. **Heroku** - Traditional Node.js deployment
3. **Railway** - Modern Node.js hosting
4. **AWS Lambda** - Serverless functions
5. **Azure Functions** - Microsoft's serverless

## Git Management

### Branching Strategy
```
main/production
  └── develop
      ├── feature/frontend-*
      ├── feature/backend-*
      └── feature/full-stack-*
```

### Committing
```bash
# Frontend changes
git add frontend/
git commit -m "feat(frontend): description"

# Backend changes
git add backend/
git commit -m "feat(backend): description"

# Full-stack changes
git add frontend/ backend/
git commit -m "feat(full-stack): description"
```

## Common Tasks

### Install New Package

**Frontend:**
```bash
cd frontend
npm install package-name
```

**Backend:**
```bash
cd backend
npm install package-name
```

### Update Dependencies

**Frontend:**
```bash
cd frontend
npm update
npm audit fix
```

**Backend:**
```bash
cd backend
npm update
npm audit fix
```

### Run Linting

**Frontend:**
```bash
cd frontend
npm run lint
```

**Backend:**
```bash
cd backend
npm run lint
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Kill process or use `PORT=3001 npm run dev` |
| Port 5000 in use | Change in `backend/.env` |
| npm ERR! 404 | Run `npm install` in correct directory |
| CORS errors | Check `FRONTEND_URL` in backend `.env` |
| Build fails | Delete `.next/` and `node_modules/`, reinstall |

## Performance Tips

1. **Use separate terminals** for frontend and backend
2. **Monitor logs** for errors in development
3. **Use process managers** in production (PM2, systemd)
4. **Enable caching** for static assets
5. **Optimize images** before deployment

## Security Checklist

- ✅ Frontend security headers configured
- ✅ CORS configured for backend
- ✅ Environment variables not committed
- ✅ API rate limiting implemented
- ✅ Input validation on backend
- ⚠️ Update `.env.local` with real API keys before deployment

---

**Last Updated**: 2026-06-05
**Status**: ✅ Ready for Development & Deployment
