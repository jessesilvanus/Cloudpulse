# CLOUDPULSE Production Deployment Guide

## Production Architecture & Endpoints

| Component | Provider | Live URL | Repository Branch |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | Vercel | `https://cloudpulse-web-w4ru-ten.vercel.app/` | `main` |
| **API Backend** | Render | `https://cloudpulse-api-edea.onrender.com` | `main` |
| **Health Checks** | Render | `https://cloudpulse-api-edea.onrender.com/health/live`<br>`https://cloudpulse-api-edea.onrender.com/health/ready` | `main` |

---

## Required Environment Variables

### Backend (Render)
- `NODE_ENV`: `production`
- `PORT`: `3001` (or Render default `10000`)
- `CORS_ORIGIN`: `https://cloudpulse-web-w4ru-ten.vercel.app`
- `FRONTEND_URL`: `https://cloudpulse-web-w4ru-ten.vercel.app`
- `API_BASE_URL`: `https://cloudpulse-api-edea.onrender.com`
- `EMAIL_PROVIDER`: `sendgrid`
- `PASSWORD_RESET_FROM_EMAIL`: `1ep23cs071.jesse@gmail.com`
- `SENDGRID_API_KEY`: *(Set in Render environment settings)*

### Frontend (Vercel)
- `VITE_API_URL`: `https://cloudpulse-api-edea.onrender.com`

---

## Deployment Verification Pipeline
1. **Typecheck & Monorepo Build**: `pnpm -r build`
2. **Automated Unit & Integration Test Suite**: `pnpm --filter @cloudpulse/api test`
3. **100-Pass Live Verification**: `node scratch/verify-master-multi-cloud.js`
