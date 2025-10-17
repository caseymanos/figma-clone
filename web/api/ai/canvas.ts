import OpenAI from 'openai'

export const runtime = 'edge'
export const maxDuration = 30 // 30 second timeout

// Note: OpenAI client is created inside the handler so we can detect env at runtime

// Tool definitions for OpenAI function calling
// These will be executed client-side
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape (rectangle, circle, or text) on the canvas at specified position with optional styling',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rect', 'circle', 'text'],
            description: 'The type of shape to create',
          },
          x: { type: 'number', description: 'X coordinate position (0-2000)' },
          y: { type: 'number', description: 'Y coordinate position (0-2000)' },
          width: { type: 'number', description: 'Width in pixels' },
          height: { type: 'number', description: 'Height in pixels' },
          color: { type: 'string', description: 'Fill color as hex code like #4f46e5' },
          text: { type: 'string', description: 'Text content when type is text' },
        },
        required: ['type', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move an existing shape to a new position',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Shape ID to move' },
          x: { type: 'number', description: 'New X coordinate' },
          y: { type: 'number', description: 'New Y coordinate' },
        },
        required: ['id', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize an existing shape',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Shape ID to resize' },
          width: { type: 'number', description: 'New width in pixels' },
          height: { type: 'number', description: 'New height in pixels' },
        },
        required: ['id', 'width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate an existing shape by degrees',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Shape ID to rotate' },
          degrees: { type: 'number', description: 'Rotation angle in degrees (0-360)' },
        },
        required: ['id', 'degrees'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeRow',
      description: 'Arrange multiple selected shapes in a horizontal row with spacing',
      parameters: {
        type: 'object',
        properties: {
          spacing: { type: 'number', description: 'Spacing between shapes in pixels', default: 16 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeGrid',
      description: 'Arrange multiple selected shapes in a grid layout',
      parameters: {
        type: 'object',
        properties: {
          rows: { type: 'number', description: 'Number of rows' },
          cols: { type: 'number', description: 'Number of columns' },
          gap: { type: 'number', description: 'Gap between cells in pixels (default: 12)' },
        },
        required: ['rows', 'cols'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'distributeShapes',
      description: 'Distribute selected shapes evenly along horizontal or vertical axis',
      parameters: {
        type: 'object',
        properties: {
          axis: {
            type: 'string',
            enum: ['x', 'y'],
            description: 'Axis to distribute along (x=horizontal, y=vertical)',
          },
          spacing: { type: 'number', description: 'Optional fixed spacing between shapes' },
        },
        required: ['axis'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createLoginForm',
      description: 'Create a complete login form with username, password fields and submit button',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'Starting X position (default: 100)' },
          y: { type: 'number', description: 'Starting Y position (default: 100)' },
        },
      },
    },
  },
]

export async function POST(request: Request): Promise<Response> {
  try {
    const { prompt, canvasId, selectedIds } = await request.json()

    if (!prompt || !canvasId) {
      return new Response('Missing prompt or canvasId', { status: 400 })
    }

    // Build context for the LLM
    const systemPrompt = `You are a canvas design assistant. You MUST use the provided tools to create and manipulate shapes.

CRITICAL: When user asks to create shapes, you MUST call the createShape tool for EACH shape requested.
Example: "create 4 circles" = call createShape tool 4 times with type='circle'
Example: "create 3 rectangles and 2 circles" = call createShape 3 times with type='rect' + 2 times with type='circle'

Available shape types: rectangle (rect), circle, text
Default colors: #4f46e5 (blue), #ef4444 (red), #10b981 (green), #f59e0b (yellow)
Canvas coordinates: 0-2000 for both x and y
Default spacing: When creating multiple shapes, spread them 150px apart horizontally so they don't overlap

${selectedIds && selectedIds.length > 0 ? `Currently selected shapes: ${selectedIds.join(', ')}` : 'No shapes currently selected.'}

When users ask to create shapes, use reasonable default sizes and positions unless specified.
When users refer to "these" or "selected shapes", use layout tools that operate on the selection.
For complex requests like "login form", use the specialized pattern tools.`

    // Detect credentials: prefer AI Gateway, fallback to direct OpenAI
    const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    const openaiKey = process.env.OPENAI_API_KEY

    const apiKey = gatewayKey || openaiKey
    if (!apiKey) {
      console.error('AI Canvas API Error: Missing AI credentials (AI_GATEWAY_API_KEY/VERCEL_OIDC_TOKEN or OPENAI_API_KEY)')
      return new Response(
        JSON.stringify({ error: 'Missing AI credentials. Configure Vercel AI Gateway or set OPENAI_API_KEY.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const client = new OpenAI({
      apiKey,
      ...(gatewayKey ? { baseURL: 'https://ai-gateway.vercel.sh/v1' } : {}),
    })

    // Use OpenAI streaming with tool_choice='required' to force tool usage
    const stream = await client.chat.completions.create({
      model: gatewayKey ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      tools,
      tool_choice: 'required', // Force the model to call at least one tool
      stream: true,
    })

    // Convert OpenAI stream to response with SSE format for client consumption
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Accumulate tool calls since they come in chunks
          const toolCallsAccumulator: Map<number, {
            id?: string
            name?: string
            arguments: string
          }> = new Map()

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta
            
            // Accumulate tool call chunks
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index
                const existing = toolCallsAccumulator.get(index) || { arguments: '' }
                
                if (toolCall.id) existing.id = toolCall.id
                if (toolCall.function?.name) existing.name = toolCall.function.name
                if (toolCall.function?.arguments) {
                  existing.arguments += toolCall.function.arguments
                }
                
                toolCallsAccumulator.set(index, existing)
              }
            }
            
            // Send text deltas if any
            if (delta?.content) {
              const event = {
                type: 'text-delta',
                textDelta: delta.content,
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            }
          }

          // Send complete tool calls after stream ends
          for (const [_, toolCall] of toolCallsAccumulator) {
            if (toolCall.name && toolCall.arguments) {
              const event = {
                type: 'tool-call',
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                args: JSON.parse(toolCall.arguments),
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            }
          }

          controller.close()
        } catch (error: any) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI Canvas API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
