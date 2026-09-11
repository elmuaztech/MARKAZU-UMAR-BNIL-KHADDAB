# Project Rules for Markazu Umar School Management System

## Server & Environment Execution
- **Always Start Server After Code Updates**: After modifying code or completing updates, always ensure the unified Next.js dev server (`npm run dev`) is active and running in the background for both frontend and backend API endpoints.

## Git & Deployment Execution
- **Push Directly to GitHub**: Any code updates, bug fixes, or enhancements must be committed and pushed directly to `origin main` on GitHub without waiting for manual approval, so that the automated GitHub Actions workflow can immediately deploy the changes to the Hostinger VPS.
- **Single Source of Truth**: PostgreSQL + Prisma is the only permanent source of truth. Never introduce mock data, hardcoded records, or JSON fallbacks.
