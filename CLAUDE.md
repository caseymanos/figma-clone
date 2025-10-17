# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern, collaborative design tool (Figma-like) focused on realtime multi-user editing, vector editing, and AI-powered canvas operations. Built with React, Konva (canvas rendering), Supabase (realtime backend), and OpenAI (AI agent).

## Development Commands

### Setup & Installation
```bash
npm install          # Install all dependencies (runs cd web && npm install)
```

### Development
```bash
npm run dev          # Start Vite dev server on port 5173
cd web && npm run dev        # Alternative form
```

### Build & Lint
```bash
npm run build        # TypeScript compile + Vite production build
cd web && npm run build      # Alternative form
cd web && npm run lint       # Run ESLint
cd web && npm run preview    # Preview production build locally
```

## Architecture

### State Management (Zustand)

The application uses multiple Zustand stores for different concerns:

1. **Canvas State** (`web/src/canvas/state.ts`)
   - `useCanvasState`: Canvas objects with last-write-wins conflict resolution via `updatedAt` timestamps
   - `useToolState`: Active tool selection and clipboard
   - Objects synced via Supabase realtime subscriptions

2. **Selection State** (`web/src/canvas/selection.ts`)
   - `useSelection`: Selected object IDs for manipulation

3. **Presence State** (`web/src/canvas/presenceState.ts`)
   - `usePresenceState`: Multi-user presence (online users, avatars, status)
   - Synced via Supabase presence channels

### Realtime Collaboration

**Data Flow**:
1. User performs action (drag, resize, create shape)
2. Local Zustand store updates immediately (optimistic UI)
3. Change persisted to Supabase `objects` table
4. Supabase broadcasts postgres_changes event to all subscribers
5. Other clients receive event and update their local state

**Cursor System** (`web/src/canvas/cursorSmoothing.ts`):
- Cursor positions broadcast in **content-space coordinates** (not stage-space)
- Uses exponential smoothing (factor: 0.15) + predictive rendering for smooth movement
- Jitter buffer with timestamped samples to handle network delays
- Adaptive send rate: 30Hz base, 60Hz burst on acceleration
- Dead zone (2px) + 50ms min interval to reduce unnecessary broadcasts

**Presence Channel** (`web/src/canvas/usePresenceChannel.ts`):
- Tracks cursor position, display name, color, avatar URL per user
- Smart payload optimization: Only include metadata (name/color) when changed (50% size reduction)
- Session settings (name/color) stored in localStorage for per-tab identity

### Canvas Rendering (Konva/React-Konva)

**Layer Architecture** (`web/src/canvas/CanvasStage.tsx`):
- **Object Layer**: Draggable shapes (rects, circles, text) with transformers
- **Cursor Layer**: Remote user cursors rendered via Konva.Group (ref-based, no React re-renders)
- Stage transform handles pan/zoom (trackpad pinch supported)

**Performance Optimizations**:
- Object updates batched via requestAnimationFrame
- Cursor rendering uses refs to avoid React render cycles
- FPS counter tracks performance (target: 60fps)
- Transform operations reset scale to prevent accumulation bugs

**Coordinate Spaces**:
- **Stage-space**: Screen coordinates (affected by pan/zoom)
- **Content-space**: Normalized canvas coordinates (stored in DB)
- Cursors broadcast in content-space, rendered via stage transform

### AI System

**Agent Architecture** (`web/src/ai/`):
- **agent.ts**: Main agent runner, executes parsed intents sequentially
- **provider.ts**: OpenAI integration for prompt → structured intent parsing
- **tools.ts**: Canvas manipulation functions (create, move, resize, arrange, distribute)
- **patterns.ts**: Complex UI patterns (login forms, etc)
- **layout.ts**: Algorithmic layout (row, grid, distribute)
- **idempotency.ts**: In-memory cache prevents duplicate operations

**AI Features**:
- Natural language → canvas operations ("create 3 blue circles in a row")
- Batch operations optimized with single DB queries
- Metrics tracking via `lib/metrics.ts`
- Supports: create, move, resize, rotate, layout-row, layout-grid, distribute

### Database Schema (Supabase)

**Tables** (`supabase/schema.sql`):
- `profiles`: User profiles (display_name, avatar_url, status)
- `canvases`: Canvas metadata (title, created_by)
- `canvas_members`: Membership/permissions (owner/editor/viewer)
- `objects`: Canvas objects (type, x, y, width, height, rotation, fill, text_content)

**RLS Policies**:
- All tables use Row Level Security
- Canvas access controlled via `canvas_members` table
- Users can only modify objects in canvases they're members of

**Storage**:
- `avatars` bucket for profile images (public read, auth write)
- 2MB upload limit enforced in UI

### Environment Variables

Required in `.env` and deployment platform:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_OPENAI_API_KEY`: OpenAI API key for AI agent (optional)

### Routing

Using React Router v7 (`web/src/routes/router.tsx`):
- `/`: Home/canvas list
- `/canvas/:canvasId`: Canvas editor
- Auth gated via `AuthGate.tsx` component

### Design System

**Design Tokens** (`web/src/styles/design-tokens.ts`):
- Figma UI3-inspired dark theme (#1e1e1e header chrome)
- Color palette, typography, spacing, transitions centralized
- Icons via SVG components in `web/src/components/icons/Icon.tsx`

## Important Implementation Details

### Cursor Rendering
- Never use React state for cursor positions (causes render thrash)
- Store cursor data in `useRef` and update Konva nodes directly
- Animation loop runs on Konva.Animation (60fps independent of React)

### Last-Write-Wins Conflict Resolution
- Objects have `updated_at` timestamps
- When receiving remote updates, compare timestamps and reject stale data
- Prevents drag loops and conflicting updates

### Keyboard Shortcuts (`web/src/canvas/useKeyboardShortcuts.ts`)
- Delete: Remove selected objects
- Cmd/Ctrl+D: Duplicate selected
- Cmd/Ctrl+C/V: Copy/paste
- Arrow keys: Nudge selected objects
- Cmd/Ctrl +/-: Zoom in/out

### Text Editing
- Double-click text objects to enter edit mode
- Overlay `TextEditor.tsx` component positioned via stage coordinates
- Selection cleared during edit to prevent interference

### Object Creation
- Default colors: shapes use `selectedColor` from ColorPalette, text uses #000000
- Shapes created with random offsets to prevent stacking
- AI-created shapes use precise positioning from prompts

### Session Settings vs Profile Settings
- **Session Settings**: Per-browser-tab name/color (localStorage)
- **Profile Settings**: Global user profile (Supabase profiles table)
- Session settings take precedence for presence display

## Testing & Deployment

### Pre-Deployment Checklist
See `DEPLOYMENT-CHECKLIST.md` for full checklist including:
- Database migration verification
- Storage bucket setup
- Realtime configuration
- Feature testing with multiple users
- Performance validation (60fps target)

### Common Issues
- **Cursors not showing**: Check presence channel subscription status
- **Objects not syncing**: Verify Realtime enabled on objects table
- **Performance drops**: Check for excessive re-renders, cursor ref optimization
- **Type errors**: Run `cd web && npm run build` to catch TypeScript issues
