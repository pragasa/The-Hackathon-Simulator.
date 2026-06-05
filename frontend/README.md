# Frontend - The Hackathon Simulator

## Overview
Next.js 16 + React 19 + TypeScript frontend for The Hackathon Simulator. Interactive web application for generating hackathon ideas and receiving critical feedback.

## Setup

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm start
```

## Build Output

The `.next/` directory contains optimized production build files.

## Pages & Routes

- `/` - Home page
- `/game` - Main hackathon simulator game
- `/results` - Results display page

## API Routes (Next.js)

- `POST /api/generate-prd` - Generate PRD
- `POST /api/generate-problem` - Generate Problem Statement
- `POST /api/generate-roast` - Generate Critical Feedback
- `POST /api/generate-usps` - Generate Unique Selling Points

## Components

Reusable React components located in `components/`.

## State Management

Zustand store for global state management (`store/`).

## Styling

- Tailwind CSS for utility-first styling
- PostCSS for CSS processing
- shadcn/ui components

## Development Stack

- **Framework**: Next.js 16.2.6
- **React**: 19.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, PostCSS 4
- **Animations**: Framer Motion
- **State**: Zustand
- **Components**: shadcn/ui, Lucide Icons

## Build Configuration

- Turbopack for fast compilation
- Security headers configured (CSP, HSTS, etc.)
- Analytics: Vercel Analytics

## Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions.
