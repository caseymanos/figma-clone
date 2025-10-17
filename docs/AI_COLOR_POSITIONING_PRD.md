# AI Canvas Agent: Color Selection & Viewport Positioning

**Document Type:** Product Requirements Document (PRD)  
**Version:** 1.0  
**Date:** October 17, 2025  
**Status:** In Development

---

## 1. Overview

Enhance the AI Canvas Agent with intelligent color selection and viewport-aware positioning capabilities. Users can describe colors naturally, and the AI understands both predefined color palettes and viewport-relative positioning (top-left, center, bottom-right, etc.).

## 2. Goals

1. **User Control:** Provide a curated color palette in the side menu for quick selection
2. **Natural Language:** Enable AI to interpret color descriptions ("dark blue", "bright red")
3. **Spatial Awareness:** Allow AI to place shapes based on viewport position ("top right corner", "center of canvas")
4. **Consistency:** Ensure colors match across UI menu and AI-generated shapes
5. **Flexibility:** Support both predefined colors and custom hex codes

---

## 3. Color Palette

### 3.1 Predefined Colors

```typescript
const CANVAS_COLORS = {
  // Primary brand colors
  indigo: '#4f46e5',      // Primary blue
  purple: '#7c3aed',      // Deep purple
  
  // Vibrant colors
  red: '#ef4444',         // Bright red
  orange: '#f97316',      // Warm orange
  yellow: '#eab308',      // Bright yellow
  green: '#22c55e',       // Vibrant green
  cyan: '#06b6d4',        // Cyan blue
  blue: '#3b82f6',        // Sky blue
  
  // Neutral palette
  gray: '#6b7280',        // Medium gray
  slate: '#64748b',       // Slate gray
  zinc: '#71717a',        // Zinc gray
  
  // Light variants (30% opacity or lighter shade)
  'indigo-light': '#e0e7ff',
  'red-light': '#fee2e2',
  'green-light': '#dcfce7',
  'blue-light': '#dbeafe',
  
  // Dark variants
  'indigo-dark': '#312e81',
  'red-dark': '#7f1d1d',
  'green-dark': '#15803d',
  'blue-dark': '#1e40af',
  
  // Grays
  white: '#ffffff',
  'gray-900': '#111827',
  'gray-800': '#1f2937',
  'gray-700': '#374151',
}
```

### 3.2 Color Display Format

Each color in the menu shows:
- Color swatch (small circle, 24px)
- Color name ("Indigo", "Red", etc.)
- Hex code on hover
- Keyboard shortcut indicator (optional)

---

## 4. User Stories

### 4.1 User Story: Color Palette Menu

**As a** user creating canvas designs  
**I want to** see available colors in a dedicated sidebar menu  
**So that** I can quickly reference what colors are available and what they look like

**Acceptance Criteria:**
- [ ] Side menu shows all 20+ predefined colors as visual swatches
- [ ] Hovering on a swatch displays color name and hex code
- [ ] Clicking a swatch sets it as "currently selected color"
- [ ] Selected color is visually highlighted (border or background)
- [ ] Menu is accessible from the main canvas view
- [ ] Menu can be toggled open/closed

### 4.2 User Story: AI Natural Color Interpretation

**As a** user describing shapes to the AI  
**I want to** describe colors in natural language ("make it blue", "a dark green circle")  
**So that** the AI understands my intent without needing to specify hex codes

**Acceptance Criteria:**
- [ ] AI interprets basic color names ("red", "blue", "green", etc.)
- [ ] AI interprets color modifiers ("dark red", "light blue", "bright yellow")
- [ ] AI interprets hex codes if provided directly
- [ ] If color is ambiguous, AI picks closest match from palette
- [ ] AI returns the matched color name in tool call arguments
- [ ] Fallback to default color if interpretation fails

### 4.3 User Story: AI Viewport-Relative Positioning

**As a** user creating layouts  
**I want to** tell the AI where to place shapes relative to the current view ("top right", "center", "bottom-left corner")  
**So that** shapes appear in logical positions without calculating pixel coordinates

**Acceptance Criteria:**
- [ ] AI recognizes position keywords: top, bottom, left, right, center, middle, corner
- [ ] AI calculates pixel coordinates from viewport position
- [ ] Shapes placed in "center" appear at canvas center (1000, 1000)
- [ ] Shapes placed in "top-right" appear near (1700, 200)
- [ ] Shapes placed in "bottom-left" appear near (300, 1800)
- [ ] Margins/padding respected (shapes don't go beyond canvas bounds)
- [ ] "Current view" respects zoom level if implemented

### 4.4 User Story: Color Selection UI

**As a** user in the UI  
**I want to** click a color from the menu before asking the AI to create shapes  
**So that** the AI uses my selected color by default

**Acceptance Criteria:**
- [ ] Selected color state persists across multiple AI requests
- [ ] AI uses selected color when user doesn't specify one
- [ ] User can override selected color in natural language ("ignore my selection, make it red")
- [ ] Visual feedback shows which color is currently selected

---

## 5. Technical Requirements

### 5.1 Frontend (React)

**New Component:** `ColorPalette.tsx`
```typescript
interface ColorPaletteProps {
  selectedColor: string  // hex code
  onColorSelect: (color: string, colorName: string) => void
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps)
```

**State Management:**
- Add `selectedColorName: string` and `selectedColorHex: string` to canvas state
- Persist selected color in localStorage (optional)
- Pass selected color to AIPanel component

**Modified Component:** `AIPanel.tsx`
```typescript
// Include selected color in prompt sent to API
const prompt = `${userInput} (Current color: ${selectedColorName})`
```

### 5.2 Backend (Edge Function)

**Updated System Prompt:**
```typescript
const systemPrompt = `...

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

**Color Interpretation Logic:**
```typescript
function interpretColor(description: string): string {
  const normalized = description.toLowerCase()
  
  // Direct match
  if (CANVAS_COLORS[normalized]) return CANVAS_COLORS[normalized]
  
  // Modifier match (e.g., "dark red" → "red-dark")
  const modifiers = ['light', 'dark', 'bright']
  for (const mod of modifiers) {
    if (normalized.includes(mod)) {
      const colorName = normalized.replace(mod, '').trim()
      const key = `${colorName}-${mod}`
      if (CANVAS_COLORS[key]) return CANVAS_COLORS[key]
    }
  }
  
  // Fallback to closest match using color distance algorithm
  return findClosestColor(description)
}
```

**Position Interpretation Logic:**
```typescript
function interpretPosition(description: string): { x: number; y: number } {
  const normalized = description.toLowerCase()
  const positions: Record<string, { x: number; y: number }> = {
    'top-left': { x: 300, y: 200 },
    'top-center': { x: 1000, y: 200 },
    'top-right': { x: 1700, y: 200 },
    'center': { x: 1000, y: 1000 },
    'bottom-left': { x: 300, y: 1800 },
    'bottom-center': { x: 1000, y: 1800 },
    'bottom-right': { x: 1700, y: 1800 },
    'left': { x: 300, y: 1000 },
    'right': { x: 1700, y: 1000 },
  }
  
  for (const [key, pos] of Object.entries(positions)) {
    if (normalized.includes(key)) return pos
  }
  
  return { x: 1000, y: 1000 } // Default to center
}
```

### 5.3 Tool Definition Updates

**Updated `createShape` Tool:**
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
          description: 'Shape type'
        },
        color: {
          type: 'string',
          description: 'Color name from palette (e.g., indigo, red, green-light, blue-dark) or hex code'
        },
        x: {
          type: 'number',
          description: 'X position (use viewport-relative positioning: top-left, center, bottom-right, etc.)'
        },
        y: {
          type: 'number',
          description: 'Y position'
        },
        width: { type: 'number' },
        height: { type: 'number' },
        text: { type: 'string' }
      },
      required: ['type', 'x', 'y']
    }
  }
}
```

---

## 6. UI/UX Design

### 6.1 Color Palette Menu Layout

```
┌─ COLORS ─────────────────────────┐
│                                   │
│ Indigo    ●  #4f46e5 [X]         │
│ Purple    ●  #7c3aed             │
│ Red       ●  #ef4444  [Selected] │
│ Orange    ●  #f97316             │
│ Yellow    ●  #eab308             │
│ Green     ●  #22c55e             │
│ Cyan      ●  #06b6d4             │
│ Blue      ●  #3b82f6             │
│                                   │
│ [Light Variants ▼]               │
│ [Dark Variants ▼]                │
│ [Grays ▼]                        │
│                                   │
└───────────────────────────────────┘
```

### 6.2 Integration Points

1. **Side Menu:** Add "Colors" section below existing tools (after "Shapes")
2. **AI Panel:** Show selected color indicator above input field
3. **Canvas:** Display color tooltip on hover (optional)

---

## 7. Examples

### 7.1 User Command: Color + Position

**Input:** "Create a dark blue circle in the top right corner"

**AI Interpretation:**
- Color: "blue-dark" (#1e40af)
- Shape: circle
- Position: top-right (x: 1700, y: 200)

**Tool Call:**
```json
{
  "toolName": "createShape",
  "args": {
    "type": "circle",
    "color": "blue-dark",
    "x": 1700,
    "y": 200,
    "width": 80,
    "height": 80
  }
}
```

### 7.2 User Command: Selected Color + Position

**User selects "indigo" from menu**  
**Input:** "Create 3 rectangles across the top"

**AI Interpretation:**
- Color: "indigo" (from selected color, user didn't override)
- Shapes: 3 rectangles
- Position: spread across top

**Tool Calls:**
```json
[
  { "toolName": "createShape", "args": { "type": "rect", "color": "indigo", "x": 400, "y": 200 } },
  { "toolName": "createShape", "args": { "type": "rect", "color": "indigo", "x": 1000, "y": 200 } },
  { "toolName": "createShape", "args": { "type": "rect", "color": "indigo", "x": 1600, "y": 200 } }
]
```

### 7.3 User Command: Override + Positioning

**User selects "indigo"**  
**Input:** "Ignore indigo, put a bright green square in the center"

**AI Interpretation:**
- Color: "green" (user overrode selected color)
- Shape: rect (square = square rect)
- Position: center (x: 1000, y: 1000)

---

## 8. Implementation Plan

### Phase 1: Backend (AI Interpretation)
1. Add color palette constant to canvas.ts
2. Implement `interpretColor()` function
3. Implement `interpretPosition()` function
4. Update system prompt with color and position mappings
5. Test with various color descriptions
6. Deploy and verify with test script

### Phase 2: Frontend (Color Menu UI)
1. Create `ColorPalette.tsx` component
2. Add to canvas layout (side menu section)
3. Add state management for selected color
4. Display selected color in AIPanel
5. Test color selection persistence

### Phase 3: Integration
1. Update `AIPanel.tsx` to include selected color in prompt
2. Pass selected color context to backend
3. End-to-end testing with UI
4. Verify color names match in tool calls

### Phase 4: Polish & Testing
1. Add color preview on tool calls
2. Handle edge cases (invalid colors, out-of-bounds positions)
3. Performance testing with many colors
4. User feedback and iteration

---

## 9. Success Metrics

- [ ] AI correctly interprets 95%+ of color descriptions
- [ ] Shapes appear in correct viewport positions
- [ ] Color menu loads in <100ms
- [ ] Selected color persists across requests
- [ ] Zero errors in tool calls related to colors
- [ ] User satisfaction: "Colors are intuitive and easy to use"

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI misinterprets color descriptions | Provide clear examples in system prompt; use fuzzy matching |
| Shapes placed outside canvas bounds | Add boundary validation; clamp coordinates to [0, 2000] |
| Performance with many colors | Memoize color lookup; use Set for O(1) lookups |
| User confusion with color names | Show hex codes on hover; provide visual swatches |

---

## 11. Open Questions

1. Should color menu be collapsible/toggleable?
2. Should users be able to create custom colors (hex picker)?
3. Should there be keyboard shortcuts for colors (Ctrl+1 = red, etc.)?
4. Should positioning support relative terms like "next to"?
5. Should colors be saved as part of shape history/undo?

---

## 12. Appendix: Color Reference

| Name | Hex | Use Case |
|------|-----|----------|
| indigo | #4f46e5 | Primary brand color |
| red | #ef4444 | Alerts, errors, danger |
| green | #22c55e | Success, positive actions |
| blue | #3b82f6 | Information, secondary |
| orange | #f97316 | Warnings, attention |
| yellow | #eab308 | Highlights, accents |
| gray | #6b7280 | Neutral, backgrounds |
| white | #ffffff | Backgrounds, light elements |
| indigo-dark | #312e81 | High contrast, dark mode |
| red-light | #fee2e2 | Light alerts, backgrounds |
