# Collaborative Design Canvas

A real-time collaborative design tool combining multiplayer editing with AI-powered design operations. Multiple users can edit simultaneously with live cursor tracking, while a natural language AI agent creates, arranges, and layouts UI elements on command.

## Features

- **Real-time Collaboration**: See other users' cursors and edits live with optimistic UI updates
- **AI-Powered Design**: Natural language commands to create and arrange canvas objects ("create a login form with 3 blue buttons in a row")
- **Vector Editing**: Create and manipulate shapes (rectangles, circles, text) with precise controls
- **Multiplayer Presence**: Live user avatars, status indicators, and cursor tracking
- **Performance Optimized**: Smooth 60fps rendering with cursor smoothing and jitter compensation

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Canvas Rendering**: Konva/React-Konva
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Realtime)
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key (optional, for AI features)

### Installation

```bash
npm install
```

### Environment Setup

Create `web/.env` with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key  # Optional
```

### Database Setup

1. Create a new Supabase project
2. Run the schema migration:
```bash
# Apply schema from supabase/schema.sql to your Supabase project
```

3. Enable Realtime on the `objects` table in Supabase dashboard
4. Create the `avatars` storage bucket (public read access)

See `DEPLOYMENT-CHECKLIST.md` for detailed setup instructions.

### Development

```bash
npm run dev
```

Visit `http://localhost:5173`

### Production Build

```bash
npm run build
```

## Architecture

- **State Management**: Multiple Zustand stores for canvas, selection, presence, and tools
- **Conflict Resolution**: Last-write-wins with timestamp-based conflict resolution
- **Cursor System**: Content-space coordinates with exponential smoothing and predictive rendering
- **AI Agent**: Structured intent parsing with batch operations and idempotency

See `CLAUDE.md` for detailed architecture documentation.

## Contributing

This is a demonstration project. For production use, review security policies and add proper authentication flows.

## License

MIT
