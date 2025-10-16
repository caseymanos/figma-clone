import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'

export const config = {
  runtime: 'edge',
}

// Tool definitions matching our canvas operations
const tools = {
  createShape: tool({
    description: 'Create a new shape (rectangle, circle, or text) on the canvas at specified position with optional styling',
    parameters: z.object({
      type: z.enum(['rect', 'circle', 'text']).describe('The type of shape to create'),
      x: z.number().describe('X coordinate position (0-2000)'),
      y: z.number().describe('Y coordinate position (0-2000)'),
      width: z.number().optional().describe('Width in pixels (default: 120 for rect, 80 for circle, 200 for text)'),
      height: z.number().optional().describe('Height in pixels (default: 80 for rect, 80 for circle, 40 for text)'),
      color: z.string().optional().describe('Fill color as hex code like #4f46e5'),
      text: z.string().optional().describe('Text content when type is text'),
    }),
    execute: async (params) => params, // Client handles execution
  }),
  
  moveShape: tool({
    description: 'Move an existing shape to a new position',
    parameters: z.object({
      id: z.string().describe('Shape ID to move'),
      x: z.number().describe('New X coordinate'),
      y: z.number().describe('New Y coordinate'),
    }),
    execute: async (params) => params,
  }),
  
  resizeShape: tool({
    description: 'Resize an existing shape',
    parameters: z.object({
      id: z.string().describe('Shape ID to resize'),
      width: z.number().describe('New width in pixels'),
      height: z.number().describe('New height in pixels'),
    }),
    execute: async (params) => params,
  }),
  
  rotateShape: tool({
    description: 'Rotate an existing shape by degrees',
    parameters: z.object({
      id: z.string().describe('Shape ID to rotate'),
      degrees: z.number().describe('Rotation angle in degrees (0-360)'),
    }),
    execute: async (params) => params,
  }),
  
  arrangeRow: tool({
    description: 'Arrange multiple selected shapes in a horizontal row with spacing',
    parameters: z.object({
      spacing: z.number().default(16).describe('Spacing between shapes in pixels'),
    }),
    execute: async (params) => params,
  }),
  
  arrangeGrid: tool({
    description: 'Arrange multiple selected shapes in a grid layout',
    parameters: z.object({
      rows: z.number().describe('Number of rows'),
      cols: z.number().describe('Number of columns'),
      gap: z.number().optional().describe('Gap between cells in pixels (default: 12)'),
    }),
    execute: async (params) => params,
  }),
  
  distributeShapes: tool({
    description: 'Distribute selected shapes evenly along horizontal or vertical axis',
    parameters: z.object({
      axis: z.enum(['x', 'y']).describe('Axis to distribute along (x=horizontal, y=vertical)'),
      spacing: z.number().optional().describe('Optional fixed spacing between shapes'),
    }),
    execute: async (params) => params,
  }),
  
  createLoginForm: tool({
    description: 'Create a complete login form with username, password fields and submit button',
    parameters: z.object({
      x: z.number().optional().describe('Starting X position (default: 100)'),
      y: z.number().optional().describe('Starting Y position (default: 100)'),
    }),
    execute: async (params) => params,
  }),
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { prompt, canvasId, selectedIds } = await req.json()

    if (!prompt || !canvasId) {
      return new Response('Missing prompt or canvasId', { status: 400 })
    }

    // Build context for the LLM
    const systemPrompt = `You are a canvas design assistant. You help users create and manipulate shapes on a collaborative canvas.

Available shape types: rectangle (rect), circle, text
Default colors: #4f46e5 (blue), #ef4444 (red), #10b981 (green), #f59e0b (yellow)
Canvas coordinates: 0-2000 for both x and y

${selectedIds && selectedIds.length > 0 ? `Currently selected shapes: ${selectedIds.join(', ')}` : 'No shapes currently selected.'}

When users ask to create shapes, use reasonable default sizes and positions unless specified.
When users refer to "these" or "selected shapes", use layout tools that operate on the selection.
For complex requests like "login form", use the specialized pattern tools.`

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt,
      tools,
      maxSteps: 5, // Allow multi-step reasoning
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('AI Canvas API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

