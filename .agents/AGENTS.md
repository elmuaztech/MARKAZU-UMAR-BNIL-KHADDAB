# Project Rules for Markazu Umar School Management System

## Server & Environment Execution
- **Always Start Server After Code Updates**: After modifying code or completing updates, always ensure the unified Next.js dev server (`npm run dev`) is active and running in the background for both frontend and backend API endpoints.

## Git & Vercel Deployment Execution
- **Approval Required Before Git Push**: After completing code changes and validating them locally on localhost, STOP and report the results. Do NOT automatically commit or push to GitHub. Only stage, commit, and push to GitHub (`git push origin main`) after receiving explicit user approval.
- **Single Source of Truth**: PostgreSQL + Prisma is the only permanent source of truth. Never introduce mock data, hardcoded records, or JSON fallbacks.
