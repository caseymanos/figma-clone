# OpenAI API Key Setup

## Required: Add OpenAI API Key to Vercel

The AI Canvas Assistant requires an OpenAI API key to function. Follow these steps:

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...` or `sk-...`)

### Step 2: Add to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/ralc/figma-clone/settings/environment-variables
2. Click "Add Environment Variable"
3. Name: `OPENAI_API_KEY`
4. Value: `sk-proj-...` (paste your key)
5. Environment: Check all three: ✅ Production ✅ Preview ✅ Development
6. Click "Save"
7. Redeploy the project (Vercel will prompt you)

**Option B: Via Vercel CLI**

```bash
vercel env add OPENAI_API_KEY
# When prompted:
# - Value: paste your OpenAI key
# - Environment: Production, Preview, Development
# Then redeploy:
vercel deploy --prod --yes
```

### Step 3: Verify

1. Open your deployed canvas: https://figma-clone-opyk8jd19-ralc.vercel.app
2. Create or open a canvas
3. In the AI panel (bottom-left), try: **"create 4 circles"**
4. Open browser console (F12) to see debug logs
5. You should see:
   - `Stream event: tool-call ...`
   - `Tool call found: createShape ...`
   - 4 circles appear on the canvas

### What Was Fixed

✅ **Correct AI SDK method**: Changed `toDataStreamResponse()` → `toTextStreamResponse()`
✅ **Enhanced system prompt**: Forces AI to call tool for each shape
✅ **Removed fallback logic**: No more mystery rectangles
✅ **Added debug logging**: Console shows tool calls for debugging
✅ **Better error messages**: Clear errors when AI fails

### Testing Commands

Once API key is added, test these:

1. **"create 4 circles"** → Should create 4 circles spread horizontally
2. **"create 3 red rectangles"** → Should create 3 red rectangles
3. **"create 2 circles and 3 rectangles"** → Should create mixed shapes
4. **"create 5 blue circles in a row"** → Should create 5 blue circles

### Troubleshooting

**If AI still creates wrong shapes:**
- Check browser console for debug logs
- Look for `Tool call found:` messages
- Verify API key is set in Vercel
- Try clearing cache and hard refresh

**If you see "AI did not generate any valid tool calls":**
- API key might be missing or invalid
- Check Vercel logs for API errors
- Verify API key has credits on OpenAI platform

**If you see rate limit errors:**
- Your OpenAI account may need credits
- Consider upgrading to paid tier
- Or use fewer requests

### Cost Estimate

- Model: GPT-4o-mini (cheap!)
- Cost per request: ~$0.001-0.003
- 1000 AI commands ≈ $1-3
- Very affordable for personal use

### Next Steps

1. ✅ Add `OPENAI_API_KEY` to Vercel
2. ✅ Redeploy if needed
3. ✅ Test with "create 4 circles"
4. ✅ Enjoy AI-powered canvas! 🎨✨

