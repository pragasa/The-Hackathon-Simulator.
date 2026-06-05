# Backend - The Hackathon Simulator

## Overview
Node.js Express backend for The Hackathon Simulator API. Handles AI-powered generation of product requirements, problem statements, critical feedback, and unique selling points.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

## Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## Production

```bash
npm start
```

## API Routes

- `POST /api/generate-prd` - Generate Product Requirements Document
- `POST /api/generate-problem` - Generate Problem Statement
- `POST /api/generate-roast` - Generate Critical Feedback
- `POST /api/generate-usps` - Generate Unique Selling Points
- `GET /api/health` - Health check endpoint

## Environment Variables

See `.env.example` for required configuration.

## Directory Structure

```
backend/
├── api/              # API request/response handlers
├── models/           # Data models
├── routes/           # Route definitions
├── middleware/       # Express middleware
├── config/           # Configuration files
├── utils/            # Utility functions
├── server.js         # Main server file
├── package.json      # Dependencies
└── .env.example      # Environment template
```

## Development Stack

- **Framework**: Express.js
- **Language**: Node.js (JavaScript)
- **Package Manager**: npm
- **CORS**: Configured for frontend communication
