# Vercel AI Gateway Setup

## Overview
The AI Canvas Agent uses Vercel AI SDK with AI Gateway for secure, managed OpenAI API key handling.

## Production Setup (Recommended)

### 1. Enable AI Gateway in Vercel
1. Go to your Vercel project: https://vercel.com/ralc/figma-clone
2. Navigate to **Settings** → **AI** tab
3. Click **Enable AI Gateway**

### 2. Add OpenAI Provider
1. In the AI Gateway settings, click **Add Provider**
2. Select **OpenAI**
3. Enter your OpenAI API key (starts with `sk-...`)
4. Save the configuration

### 3. Deploy
Once AI Gateway is configured, the API route `/api/ai/canvas.ts` will automatically use the managed key. No environment variables needed in your deployment!

## Local Development Setup

### Option A: Using AI Gateway (Recommended)
1. Set up AI Gateway as above
2. Run `vercel link` in your project directory
3. Run `vercel env pull .env.local` to pull environment variables
4. The local dev server will use AI Gateway automatically

### Option B: Direct API Key (Quick Start)
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. The API route will use the local key when `process.env.OPENAI_API_KEY` is available

## Testing the Integration

Once configured, test with these prompts in the AI panel:

**Simple Commands:**
- "Create a blue rectangle"
- "Create a circle at 200, 300"
- "Add text that says Hello World"

**Complex Commands:**
- "Create a login form with username and password fields"
- "Make 5 colorful circles arranged in a row"
- "Create a 3x3 grid of squares"

**Contextual Commands (with selection):**
- Select shapes, then: "Arrange these in a horizontal row"
- Select shapes, then: "Make a grid with 2 rows and 3 columns"
- Select shapes, then: "Distribute these evenly"

## Costs & Rate Limits

**OpenAI GPT-4o-mini Pricing:**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Typical usage per prompt:**
- Simple command: ~500 tokens (~$0.0003)
- Complex command: ~2000 tokens (~$0.0012)

**Vercel AI Gateway Benefits:**
- Built-in caching (reduces duplicate calls)
- Rate limiting per user
- Usage analytics in Vercel dashboard
- Automatic failover between providers
- No API keys in your codebase

## Troubleshooting

**Error: "AI API error: Unauthorized"**
- Check that AI Gateway is enabled in Vercel
- Verify OpenAI provider is configured with a valid API key
- Redeploy your project after changing AI Gateway settings

**Error: "No response body"**
- Check browser console for CORS errors
- Verify `/api/ai/canvas.ts` is deployed (check Vercel Functions tab)
- Test the API route directly: `curl https://your-app.vercel.app/api/ai/canvas`

**Local development not working:**
- Run `vercel env pull .env.local` to sync environment variables
- Or add `OPENAI_API_KEY` directly to `.env.local`
- Restart dev server after changing `.env.local`

