# Project Status & Work Log
**Last Updated:** 2026-08-26

This file tracks the ongoing development, fixes, and current status of the Kopargaon Smart City GIS AI Platform. It will be updated continuously as new features are added or issues are resolved.

## 🚀 Current Status: What is Working
- **Frontend (Client)**: React SPA is successfully deployed on Vercel. UI, routing, and context (Auth, Theme, Language) are fully functional.
- **Backend (Server)**: Node.js Express server is successfully deployed on Render. API endpoints for Auth, Projects, Complaints, etc., are accessible.
- **Monorepo Configuration**: NPM Workspaces are correctly configured (`client`, `server`, `mcp-server`) allowing smooth unified dependency installation on cloud providers like Render.
- **Authentication**: 
  - Admin/Citizen login via OTP and Email/Password is functional.
  - **Google OAuth**: Configured and working for Citizen and Business logins. Google Cloud Console origins and Vercel/Render environment variables (`VITE_API_URL`, `GOOGLE_CLIENT_ID`) are correctly synced.
- **GIS Map Viewer**: Leaflet integration with mock data overlays is rendering correctly.
- **AI/LLM Integration**: Configured to use Groq API for urban planning queries and complaint priority scoring.

## 🛠️ Technologies in Use
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router, React-Leaflet, Google OAuth.
- **Backend**: Node.js, Express 5, PostgreSQL (pg), JWT, bcrypt.
- **Deployment**: Vercel (Frontend), Render (Backend).
- **AI/Services**: Groq (LLM), Google Cloud (OAuth, TTS), Supabase (Database).

## 📝 Changelog / Work Log

### [2026-08-26] - Deployment & Authentication Fixes
- **Render Deployment Fix**: Diagnosed an `ERR_MODULE_NOT_FOUND: Cannot find package 'pg'` issue on Render.
  - *Fix*: Added `"workspaces": ["client", "server", "mcp-server"]` to the root `package.json` to configure the project as a proper NPM monorepo. Ran `npm install` at the root to update `package-lock.json` with correct symlinks.
- **Vercel Environment Variables Fix**: Resolved issues with setting public variables in Vercel.
  - *Fix*: Configured `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` as "Config" (plain text) rather than "Secret" so Vite can expose them to the browser. Set the backend URL to `https://skh-app.onrender.com/api`.
- **Google OAuth Configuration**: Diagnosed "Invalid Google credential" error during login.
  - *Fix*: Traced the full authentication flow. Confirmed that Vercel domain (`https://skh-app-m7hi.vercel.app`) needed to be added to Google Cloud Console as an Authorized JavaScript Origin, and `GOOGLE_CLIENT_ID` must be set in the Render backend environment for token verification to succeed.

---
*Note: This file will be maintained and updated with every new feature implementation or bug fix.*
