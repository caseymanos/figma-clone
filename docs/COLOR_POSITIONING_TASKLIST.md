# AI Canvas Color & Positioning - Implementation Task List

**Status:** Ready for Development  
**Last Updated:** October 17, 2025  
**Total Tasks:** 25  
**Estimated Duration:** 3-5 developer days

---

## Overview

This document breaks down the Color Selection & Viewport Positioning PRD into actionable tasks with specific files, code locations, and implementation details.

---

## PHASE 1: Backend (Color & Position Interpretation)

**Goal:** Implement AI understanding of colors and viewport-relative positioning  
**Duration:** 1-2 days  
**Key File:** `web/api/ai/canvas.ts`

### Task 1.1: Add Color Palette Constant
**File:** `web/api/ai/canvas.ts` (top of file, after imports)  
**What to do:**
```typescript
// Add after line 8 (after imports, before tools definition)
const CANVAS_COLORS = {
  // ... 20+ color definitions from PRD section 3.1
}
```
**Details:**
- Copy all 20+ colors from PRD section 3.1 (indigo, purple, red, orange, yellow, green, cyan, blue, gray, slate, zinc, light variants, dark variants, grays)
- Export as constant so it can be imported by tests
- Add TypeScript type: `Record<string, string>`

**Acceptance Criteria:**
- [ ] CANVAS_COLORS object has 20+ entries
- [ ] All hex codes are valid (#rrggbb format)
- [ ] All color names are lowercase with hyphens (e.g., "indigo-dark")

---

### Task 1.2: Implement interpretColor() Function
**File:** `web/api/ai/canvas.ts` (add around line 100, before handler)  
**What to do:**
```typescript
function interpretColor(description: string): string {
  const normalized = description.toLowerCase()
  
  // Step 1: Direct match check
  if (CANVAS_COLORS[normalized]) return CANVAS_COLORS[normalized]
  
  // Step 2: Modifier matching (e.g., "dark red" → "red-dark")
  const modifiers = ['light', 'dark', 'bright']
  for (const mod of modifiers) {
    if (normalized.includes(mod)) {
      const colorName = normalized.replace(mod, '').trim()
      const key = `${colorName}-${mod}`
      if (CANVAS_COLORS[key]) return CANVAS_COLORS[key]
    }
  }
  
  // Step 3: Fallback - find closest match
  return findClosestColor(description) || '#4f46e5' // default to indigo
}

function findClosestColor(description: string): string {
  // Simple fuzzy matching - can be enhanced later
  const normalized = description.toLowerCase()
  for (const [name, hex] of Object.entries(CANVAS_COLORS)) {
    if (name.includes(normalized) || normalized.includes(name)) {
      return hex
    }
  }
  return CANVAS_COLORS.indigo // default fallback
}
```
**Details:**
- Handle color name normalization (lowercase, trim)
- Support modifiers: "light", "dark", "bright"
- Implement fuzzy matching for misspellings
- Return hex code (not color name)

**Acceptance Criteria:**
- [ ] "blue" → returns blue hex code
- [ ] "dark blue" → returns blue-dark hex code
- [ ] "light red" → returns red-light hex code
- [ ] Unknown color returns fallback color
- [ ] Case-insensitive matching works

---

### Task 1.3: Implement interpretPosition() Function
**File:** `web/api/ai/canvas.ts` (add after interpretColor(), around line 130)  
**What to do:**
```typescript
function interpretPosition(description: string): { x: number; y: number } {
  const normalized = description.toLowerCase()
  
  const positions: Record<string, { x: number; y: number }> = {
    'top-left': { x: 300, y: 200 },
    'top-center': { x: 1000, y: 200 },
    'top-right': { x: 1700, y: 200 },
    'center': { x: 1000, y: 1000 },
    'middle': { x: 1000, y: 1000 },
    'bottom-left': { x: 300, y: 1800 },
    'bottom-center': { x: 1000, y: 1800 },
    'bottom-right': { x: 1700, y: 1800 },
    'left': { x: 300, y: 1000 },
    'right': { x: 1700, y: 1000 },
  }
  
  // Check if any position keyword matches
  for (const [key, pos] of Object.entries(positions)) {
    if (normalized.includes(key)) return pos
  }
  
  // Default to center if no match
  return { x: 1000, y: 1000 }
}
```
**Details:**
- Map position keywords to pixel coordinates
- Canvas is 2000x2000 (0-2000 range)
- Padding: ~300px from left/right, ~200px from top/bottom
- Return both x and y

**Acceptance Criteria:**
- [ ] "top-left" returns { x: 300, y: 200 }
- [ ] "center" returns { x: 1000, y: 1000 }
- [ ] "bottom-right" returns { x: 1700, y: 1800 }
- [ ] Unrecognized keywords default to center
- [ ] All coordinates within valid range

---

### Task 1.4: Update System Prompt
**File:** `web/api/ai/canvas.ts` (around line 150-170 where `systemPrompt` is defined)  
**What to do:**
```typescript
const systemPrompt = `You are a canvas design assistant...

COLORS AVAILABLE:
${Object.entries(CANVAS_COLORS).map(([name, hex]) => `- ${name}: ${hex}`).join('\n')}

When user mentions a color, map it to the closest available color from above.
Color examples:
- "blue" → "blue" (#3b82f6)
- "dark blue" → "blue-dark" (#1e40af)  
- "light red" → "red-light" (#fee2e2)
- "navy" → "blue-dark"
- "crimson" → "red"

POSITIONING KEYWORDS:
- "top-left" or "top left" → x: 300, y: 200
- "top-center" or "top middle" → x: 1000, y: 200
- "top-right" → x: 1700, y: 200
- "center" or "middle" → x: 1000, y: 1000
- "bottom-left" → x: 300, y: 1800
- "bottom-center" → x: 1000, y: 1800
- "bottom-right" → x: 1700, y: 1800
- "left" → x: 300, y: 1000
- "right" → x: 1700, y: 1000

When user specifies positioning, use above mappings. Add padding of ~150-200px from edges.
...`
```
**Details:**
- Insert after existing instructions
- Dynamically build color list from CANVAS_COLORS constant
- Provide clear examples of color interpretation
- Define all positioning keywords
- Include defaults (center if ambiguous)

**Acceptance Criteria:**
- [ ] System prompt contains all colors from CANVAS_COLORS
- [ ] All positioning keywords documented
- [ ] Color examples provided
- [ ] No syntax errors in prompt

---

### Task 1.5: Update createShape Tool Definition
**File:** `web/api/ai/canvas.ts` (around line 13-37 in the tools definition)  
**What to do:**
- Find the `createShape` tool definition in tools array
- Add `color` field to parameters:
```typescript
{
  type: 'function',
  function: {
    name: 'createShape',
    description: 'Create a new shape with specified color and position',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['rect', 'circle', 'text'],
          description: 'The type of shape to create',
        },
        color: {  // ADD THIS
          type: 'string',
          description: 'Color name from palette (e.g., indigo, red, green-light, blue-dark) or hex code'
        },
        x: { type: 'number', description: 'X coordinate position' },
        y: { type: 'number', description: 'Y coordinate position' },
        // ... rest unchanged
      },
      required: ['type', 'x', 'y'],
    },
  }
}
```
**Details:**
- Color is optional (not in required array) but should be included
- Accept color names (from CANVAS_COLORS keys) or hex codes
- Document clearly for AI understanding

**Acceptance Criteria:**
- [ ] Color parameter added to createShape schema
- [ ] Tool parses color names correctly
- [ ] AI can see color parameter in tool definition

---

### Task 1.6: Create Backend Test Cases
**File:** `test-ai-api.mjs` (update existing test script)  
**What to do:**
Add new test cases to verify color and position interpretation:
```javascript
const testCases = [
  { prompt: 'create a blue circle', expectedColor: 'blue' },
  { prompt: 'create a dark green rectangle', expectedColor: 'green-dark' },
  { prompt: 'create a light red circle', expectedColor: 'red-light' },
  { prompt: 'put a red shape in the center', expectedX: 1000, expectedY: 1000 },
  { prompt: 'create a blue circle in the top right corner', expectedX: 1700, expectedY: 200 },
  { prompt: 'place a green square in the bottom left', expectedX: 300, expectedY: 1800 },
  { prompt: 'create indigo shapes across the top', expectedY: 200 },
]
```
**Details:**
- Run 15+ test cases covering various color descriptions
- Run 9+ test cases covering positioning keywords
- Verify tool calls contain correct color and x,y values
- Document expected outputs

**Acceptance Criteria:**
- [ ] All color interpretation tests pass
- [ ] All positioning tests pass
- [ ] Test script shows colors in output
- [ ] No errors in tool calls

---

### Task 1.7: Deploy Phase 1
**What to do:**
```bash
git add web/api/ai/canvas.ts test-ai-api.mjs
git commit -m "feat: implement color interpretation and viewport positioning"
git push origin main
```
**Details:**
- Commit all Phase 1 changes
- Push to main
- Wait for Vercel deployment (30-40s)
- Run test script against new deployment
- Verify tool calls have correct colors and positions

**Acceptance Criteria:**
- [ ] Deployment successful (Ready status)
- [ ] Test script shows tool calls with colors
- [ ] Coordinates match expected positions
- [ ] No API errors

---

## PHASE 2: Frontend (Color Palette UI)

**Goal:** Create color picker component and integrate into canvas  
**Duration:** 1-2 days  
**Key Files:** `web/src/components/ColorPalette.tsx`, `web/src/routes/CanvasRoute.tsx`

### Task 2.1: Create ColorPalette Component
**File:** `web/src/components/ColorPalette.tsx` (NEW FILE)  
**What to do:**
```typescript
import { CANVAS_COLORS } from '../lib/colors'

interface ColorPaletteProps {
  selectedColor: string  // hex code or color name
  onColorSelect: (colorName: string, colorHex: string) => void
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
        Colors
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8 }}>
        {Object.entries(CANVAS_COLORS).map(([name, hex]) => (
          <button
            key={name}
            onClick={() => onColorSelect(name, hex)}
            title={`${name}: ${hex}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
              borderRadius: 8,
              border: selectedColor === hex ? '2px solid #4f46e5' : '1px solid #d1d5db',
              background: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = selectedColor === hex ? '#4f46e5' : '#d1d5db')}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: hex,
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ fontSize: 11, color: '#6b7280' }}>{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```
**Details:**
- Create color swatches with visual circles
- Show color name below/beside swatch
- Show hex code on hover (title attribute)
- Highlight selected color with blue border
- Grid layout for responsive display
- Handle click to select color

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] All 20+ colors display
- [ ] Clicking a color triggers onColorSelect
- [ ] Selected color has visual highlight
- [ ] Hex code shows on hover

---

### Task 2.2: Create Colors Utility Module
**File:** `web/src/lib/colors.ts` (NEW FILE)  
**What to do:**
```typescript
// Export color palette for both frontend and to share with backend
export const CANVAS_COLORS = {
  indigo: '#4f46e5',
  purple: '#7c3aed',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  gray: '#6b7280',
  slate: '#64748b',
  zinc: '#71717a',
  'indigo-light': '#e0e7ff',
  'red-light': '#fee2e2',
  'green-light': '#dcfce7',
  'blue-light': '#dbeafe',
  'indigo-dark': '#312e81',
  'red-dark': '#7f1d1d',
  'green-dark': '#15803d',
  'blue-dark': '#1e40af',
  white: '#ffffff',
  'gray-900': '#111827',
  'gray-800': '#1f2937',
  'gray-700': '#374151',
}

export type ColorName = keyof typeof CANVAS_COLORS
```
**Details:**
- Single source of truth for colors (used by both frontend and backend)
- Export TypeScript type for type safety
- Can be imported in canvas.ts later for backend consistency

**Acceptance Criteria:**
- [ ] File exports CANVAS_COLORS and ColorName type
- [ ] All 20+ colors present
- [ ] No import errors

---

### Task 2.3: Add State to CanvasRoute Component
**File:** `web/src/routes/CanvasRoute.tsx` (add state, around line 30-50)  
**What to do:**
```typescript
import { ColorPalette } from '../components/ColorPalette'

export function CanvasRoute() {
  // ... existing state ...
  
  // ADD THESE LINES:
  const [selectedColorName, setSelectedColorName] = useState<string>('indigo')
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#4f46e5')
  
  const handleColorSelect = (colorName: string, colorHex: string) => {
    setSelectedColorName(colorName)
    setSelectedColorHex(colorHex)
    // Save to localStorage for persistence
    localStorage.setItem('canvasSelectedColor', JSON.stringify({ colorName, colorHex }))
  }
  
  // Load from localStorage on mount (useEffect)
  useEffect(() => {
    const saved = localStorage.getItem('canvasSelectedColor')
    if (saved) {
      const { colorName, colorHex } = JSON.parse(saved)
      setSelectedColorName(colorName)
      setSelectedColorHex(colorHex)
    }
  }, [])
  
  // ... rest of component ...
}
```
**Details:**
- Add two state variables for selected color
- Create handler function for color selection
- Persist to localStorage
- Load from localStorage on mount
- Default to 'indigo' if no saved value

**Acceptance Criteria:**
- [ ] State variables initialized
- [ ] Handler function works
- [ ] localStorage save/load works
- [ ] Persists across page reloads

---

### Task 2.4: Integrate ColorPalette Component
**File:** `web/src/routes/CanvasRoute.tsx` (find where to insert in JSX, likely around line 120-150)  
**What to do:**
- Locate the JSX return statement in CanvasRoute
- Add ColorPalette component to the side panel (next to AIPanel):
```typescript
<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
  <AIPanel canvasId={canvasId} selectedColorName={selectedColorName} />
  <ColorPalette 
    selectedColor={selectedColorHex} 
    onColorSelect={handleColorSelect}
  />
</div>
```
**Details:**
- Place ColorPalette below AIPanel in the side menu
- Pass selectedColorHex as prop
- Pass handleColorSelect as callback
- Maintain consistent styling/spacing

**Acceptance Criteria:**
- [ ] ColorPalette renders in UI
- [ ] Located below AIPanel
- [ ] Color selection works
- [ ] No styling issues

---

### Task 2.5: Add Visual Feedback for Selected Color
**File:** `web/src/components/AIPanel.tsx` (modify around line 45-50)  
**What to do:**
```typescript
interface AIPanelProps {
  canvasId: string
  selectedColorName?: string  // ADD THIS
}

export function AIPanel({ canvasId, selectedColorName }: AIPanelProps) {
  // ... existing code ...
  
  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#4f46e5' }}>
          AI Canvas Assistant
        </h3>
      </div>
      
      {/* ADD THIS SECTION */}
      {selectedColorName && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, padding: '6px 10px', background: '#f3f4f6', borderRadius: 4 }}>
          Current color: <span style={{ fontWeight: 600, color: '#1f2937' }}>{selectedColorName}</span>
        </div>
      )}
      
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        {/* ... existing form ... */}
      </form>
    </div>
  )
}
```
**Details:**
- Display selected color name above input field
- Show in subtle gray box for visual hierarchy
- Help user understand what color will be used
- Can be overridden in prompt text

**Acceptance Criteria:**
- [ ] Selected color displays in AIPanel
- [ ] Shows color name, not hex code
- [ ] Only shows if color selected
- [ ] Styling looks good

---

### Task 2.6: Local UI Testing
**What to do:**
```bash
cd web
npm run dev
# Open http://localhost:5173 in browser
```
**Test Cases:**
1. ColorPalette renders with all colors
2. Clicking a color highlights it
3. Hex code shows on hover
4. Selected color persists after page reload
5. Selected color displays in AIPanel
6. No console errors

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] No console errors
- [ ] UI looks polished

---

## PHASE 3: Integration (Connect Backend & Frontend)

**Goal:** Connect selected color to AI requests  
**Duration:** 0.5-1 day  
**Key Files:** `web/src/components/AIPanel.tsx`, `web/src/ai/provider.ts`

### Task 3.1: Update AIPanel to Pass Selected Color
**File:** `web/src/components/AIPanel.tsx` (around line 12-18 in onSubmit)  
**What to do:**
```typescript
const onSubmit = async (e: any) => {
  e.preventDefault()
  if (!prompt.trim()) return
  setRunning(true)
  setSteps([])
  try {
    // ADD selectedColorName to prompt
    const enhancedPrompt = selectedColorName 
      ? `${prompt} (Current color: ${selectedColorName})`
      : prompt
    
    const res = await runAgent(enhancedPrompt, { canvasId, selectedIds })
    setSteps(res.steps)
  } catch (e: any) {
    setSteps([{ description: 'Agent failed', status: 'error', error: e?.message || String(e) }])
  } finally {
    setRunning(false)
  }
}
```
**Details:**
- Include selected color in prompt text
- Format: "(Current color: colorName)"
- Only add if color is selected
- Fallback to original prompt if no color

**Acceptance Criteria:**
- [ ] Selected color included in API request
- [ ] Prompt format is clear
- [ ] Works with and without color selection

---

### Task 3.2: Update Provider to Accept Color Context
**File:** `web/src/ai/provider.ts` (ensure it's receiving the enhanced prompt)  
**What to do:**
- No changes needed if using enhanced prompt from AIPanel
- Verify color context is in prompt string
- Ensure API receives full prompt

**Acceptance Criteria:**
- [ ] Color context appears in API logs
- [ ] AI receives information about selected color

---

### Task 3.3: End-to-End Flow Testing
**What to do:**
Test the complete flow:
1. Open app at https://figma-clone-[latest].vercel.app
2. Select "red" from ColorPalette
3. Type "create a circle" in AIPanel
4. Verify "Current color: red" shows below heading
5. Click Run
6. Check that a red circle is created
7. Verify no console errors

**Acceptance Criteria:**
- [ ] Selected color displays in AIPanel
- [ ] API receives selected color in prompt
- [ ] Shape is created with selected color
- [ ] No errors

---

### Task 3.4: Test Color Override Scenarios
**What to do:**
Test that AI can override selected color:
1. Select "indigo" from menu
2. Type "create a bright green square"
3. Verify green square is created, not indigo
4. Repeat with other colors

**Acceptance Criteria:**
- [ ] AI correctly interprets color override
- [ ] Explicit color in prompt takes precedence
- [ ] Works for all color descriptions

---

### Task 3.5: Deploy Phase 3
**What to do:**
```bash
git add web/src/components/AIPanel.tsx web/src/components/ColorPalette.tsx web/src/lib/colors.ts web/src/routes/CanvasRoute.tsx
git commit -m "feat: integrate color selection UI with AI agent"
git push origin main
```
**Details:**
- Commit all Phase 3 changes
- Push to main
- Wait for deployment
- Test at live URL

**Acceptance Criteria:**
- [ ] Deployment successful
- [ ] All colors load in UI
- [ ] E2E flow works
- [ ] No errors in logs

---

## PHASE 4: Polish, Testing & Documentation

**Goal:** Handle edge cases, optimize, document  
**Duration:** 0.5-1 day  
**Key Files:** Various

### Task 4.1: Edge Case Handling
**File:** `web/api/ai/canvas.ts` (update interpretColor and interpretPosition functions)  
**What to do:**
```typescript
function interpretColor(description: string): string {
  const normalized = description.toLowerCase().trim()
  
  // Validate hex codes
  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.toLowerCase()
  }
  
  // ... existing logic ...
  
  // Always return valid hex code, never undefined
  return CANVAS_COLORS.indigo  // safe fallback
}

function interpretPosition(description: string): { x: number; y: number } {
  // ... existing logic ...
  
  const pos = { x: 1000, y: 1000 }
  
  // Validate coordinates are within canvas bounds [0, 2000]
  pos.x = Math.max(0, Math.min(2000, pos.x))
  pos.y = Math.max(0, Math.min(2000, pos.y))
  
  return pos
}
```
**Details:**
- Validate color hex codes
- Clamp coordinates to [0, 2000]
- Never return undefined
- Handle edge cases gracefully

**Acceptance Criteria:**
- [ ] Invalid colors return fallback
- [ ] Out-of-bounds coordinates are clamped
- [ ] No null/undefined returns

---

### Task 4.2: Add Color Preview in Feedback
**File:** `web/src/components/AIPanel.tsx` (around line 85-95 where steps render)  
**What to do:**
```typescript
{steps.length > 0 && (
  <div style={{ fontSize: 12, color: '#374151' }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
        <span>{s.status === 'success' ? '✅' : s.status === 'error' ? '❌' : '⏳'}</span>
        <span>{s.description}{s.error ? ` — ${s.error}` : ''}</span>
        
        {/* ADD COLOR PREVIEW IF AVAILABLE */}
        {s.color && (
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: s.color,
              border: '1px solid rgba(0,0,0,0.2)',
              marginLeft: 4,
            }}
            title={s.color}
          />
        )}
      </div>
    ))}
  </div>
)}
```
**Details:**
- Show small color swatch next to each step
- Helps user see what color was used
- Optional, only if color data available

**Acceptance Criteria:**
- [ ] Color swatches display correctly
- [ ] No console errors
- [ ] Looks polished

---

### Task 4.3: Performance Optimization
**File:** `web/api/ai/canvas.ts` (optimize color lookup)  
**What to do:**
```typescript
// At top of file, create lookup sets for O(1) performance
const colorNames = new Set(Object.keys(CANVAS_COLORS))
const colorHexes = new Set(Object.values(CANVAS_COLORS))

function interpretColor(description: string): string {
  const normalized = description.toLowerCase()
  
  // Use Set for O(1) lookup instead of object property check
  if (colorNames.has(normalized)) {
    return CANVAS_COLORS[normalized as keyof typeof CANVAS_COLORS]
  }
  
  // ... rest of logic ...
}
```
**Details:**
- Pre-compute lookup sets
- Memoize function results if called multiple times
- Profile for performance bottlenecks
- Optimize if needed for large volumes

**Acceptance Criteria:**
- [ ] No performance degradation
- [ ] API response time unchanged
- [ ] Lookup is O(1)

---

### Task 4.4: Update Project Documentation
**Files:** `README.md`, `docs/ai-gateway-setup.md`  
**What to do:**
1. Update `README.md` - Add section about color selection feature:
```markdown
### Color Selection & Positioning

The AI Canvas Agent supports natural language color descriptions and viewport-relative positioning:

**Colors:** Select from 20+ predefined colors in the sidebar, or describe colors naturally ("dark blue", "light red")
**Positioning:** Tell the AI where to place shapes ("top right corner", "center", "bottom left")

Examples:
- "Create a dark blue circle in the center"
- "Make 3 green rectangles across the top"
```

2. Update `docs/ai-gateway-setup.md` - Add color section:
```markdown
## Color Selection

Users can select colors from the sidebar or describe them in natural language:
- Basic colors: red, blue, green, yellow, orange, purple, etc.
- Modifiers: "light blue", "dark red", "bright green"
- Hex codes: "#ff0000" or similar

The AI will use the selected color as default unless overridden in the request.
```

**Acceptance Criteria:**
- [ ] README updated with color/positioning examples
- [ ] AI Gateway guide mentions color selection
- [ ] Documentation is clear and helpful

---

### Task 4.5: User Acceptance Testing
**What to do:**
Create test scenarios for stakeholder review:

```markdown
## UAT Test Cases

1. **Color Menu Visibility**
   - Can see color palette in sidebar ✓
   - All 20+ colors display ✓
   - Hover shows hex code ✓

2. **Color Selection**
   - Click color highlights it ✓
   - Selection persists on page reload ✓
   - Shows in AIPanel as "Current color" ✓

3. **AI Color Interpretation**
   - "create blue circle" creates blue shape ✓
   - "dark green" creates green-dark color ✓
   - "light red" creates red-light color ✓
   - Override selection: "ignore color, make red" ✓

4. **Positioning**
   - "top left" places shape in top-left ✓
   - "center" places in canvas center ✓
   - "bottom right" places in bottom-right ✓
   - "left side" places on left ✓

5. **Combined (Color + Position)**
   - "dark blue circle in top right" ✓
   - "3 green rectangles across top" ✓
   - "red square in center" ✓

6. **UI/UX**
   - No console errors ✓
   - Smooth interactions ✓
   - Responsive design ✓
```

**Acceptance Criteria:**
- [ ] All UAT test cases pass
- [ ] User feedback is positive
- [ ] No critical bugs found

---

## Summary by File

### New Files to Create
- `web/src/components/ColorPalette.tsx` - Color picker component
- `web/src/lib/colors.ts` - Color palette constants

### Files to Modify
- `web/api/ai/canvas.ts` - Add color/position interpretation, update system prompt
- `web/src/routes/CanvasRoute.tsx` - Add state management for selected color
- `web/src/components/AIPanel.tsx` - Display selected color, pass to API
- `web/src/ai/provider.ts` - No changes needed (receives enhanced prompt)
- `README.md` - Add feature documentation
- `docs/ai-gateway-setup.md` - Add color selection guide
- `test-ai-api.mjs` - Add color/positioning test cases

### Build & Deploy
- Each phase ends with: `git add`, `git commit`, `git push`, verify deployment

---

## Success Criteria (Complete)

- [ ] Phase 1: Backend color/position interpretation works
- [ ] Phase 2: Color palette UI displays and functions
- [ ] Phase 3: E2E flow works (select color → AI uses it)
- [ ] Phase 4: Edge cases handled, documented, tested
- [ ] All 25 tasks completed
- [ ] Zero critical bugs
- [ ] User satisfied with colors and positioning

---

## Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 1 | 1-2 days | Day 1 | Day 2 |
| 2 | 1-2 days | Day 2 | Day 3 |
| 3 | 0.5-1 day | Day 3 | Day 4 |
| 4 | 0.5-1 day | Day 4 | Day 4 |
| **Total** | **3-5 days** | | |

---

## Next Steps

1. Review this task list with the team
2. Start Phase 1 Task 1.1 (add color palette constant)
3. Follow tasks in order
4. Mark tasks complete in the todo list as you finish them
5. Deploy after each phase
6. Get feedback at Phase 4

Good luck! 🚀
