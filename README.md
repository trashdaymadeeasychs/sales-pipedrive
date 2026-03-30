# CRM Pro — Netlify Deploy Guide

## Deploy in 3 steps

### 1. Install & build
```
npm install
npm run build
```
This creates a `dist/` folder.

### 2. Drag & drop to Netlify
- Go to https://app.netlify.com
- Drag the `dist/` folder onto the Netlify dashboard
- Your site is live instantly

### 3. Add your Anthropic API key (for AI features)
- In Netlify: Site Settings → Environment Variables
- Add: `ANTHROPIC_API_KEY` = your key from https://console.anthropic.com
- Redeploy the site (Deploys → Trigger deploy)

---

## Local development
```
npm install
npm run dev
```
Open http://localhost:5173

Note: AI features won't work locally unless you run `netlify dev` with the Netlify CLI installed.

## Data
All your CRM data is saved to your browser's localStorage automatically — no database needed.
