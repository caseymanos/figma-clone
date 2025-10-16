// Vercel AI SDK provider using streaming function calls

export type ParsedIntent =
  | { kind: 'create'; type: 'rect' | 'circle' | 'text'; x?: number; y?: number; width?: number; height?: number; color?: string; text?: string }
  | { kind: 'move'; id: string; x: number; y: number }
  | { kind: 'resize'; id: string; width: number; height: number }
  | { kind: 'rotate'; id: string; degrees: number }
  | { kind: 'layout-row'; ids?: string[]; spacing?: number }
  | { kind: 'layout-grid'; ids?: string[]; rows: number; cols: number; gap?: number }
  | { kind: 'distribute'; ids?: string[]; axis: 'x' | 'y'; spacing?: number }
  | { kind: 'pattern-login'; x?: number; y?: number }

export interface Provider {
  parse(prompt: string, context: { canvasId: string; selectedIds?: string[] }): Promise<ParsedIntent[]>
}

export const provider: Provider = {
  async parse(prompt: string, context: { canvasId: string; selectedIds?: string[] }): Promise<ParsedIntent[]> {
    try {
      const response = await fetch('/api/ai/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          canvasId: context.canvasId,
          selectedIds: context.selectedIds || [],
        }),
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      // Parse the streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      const toolCalls: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        
        // Process complete JSON objects from the stream
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('0:')) continue
          
          try {
            const json = JSON.parse(line.slice(2))
            
            // Extract tool calls from the stream
            if (json.type === 'tool-call') {
              toolCalls.push(json)
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      // Convert tool calls to ParsedIntents
      const intents: ParsedIntent[] = []
      
      for (const call of toolCalls) {
        const toolName = call.toolName
        const args = call.args

        switch (toolName) {
          case 'createShape':
            intents.push({
              kind: 'create',
              type: args.type,
              x: args.x,
              y: args.y,
              width: args.width,
              height: args.height,
              color: args.color,
              text: args.text,
            })
            break

          case 'moveShape':
            intents.push({
              kind: 'move',
              id: args.id,
              x: args.x,
              y: args.y,
            })
            break

          case 'resizeShape':
            intents.push({
              kind: 'resize',
              id: args.id,
              width: args.width,
              height: args.height,
            })
            break

          case 'rotateShape':
            intents.push({
              kind: 'rotate',
              id: args.id,
              degrees: args.degrees,
            })
            break

          case 'arrangeRow':
            intents.push({
              kind: 'layout-row',
              ids: context.selectedIds,
              spacing: args.spacing,
            })
            break

          case 'arrangeGrid':
            intents.push({
              kind: 'layout-grid',
              ids: context.selectedIds,
              rows: args.rows,
              cols: args.cols,
              gap: args.gap,
            })
            break

          case 'distributeShapes':
            intents.push({
              kind: 'distribute',
              ids: context.selectedIds,
              axis: args.axis,
              spacing: args.spacing,
            })
            break

          case 'createLoginForm':
            intents.push({
              kind: 'pattern-login',
              x: args.x,
              y: args.y,
            })
            break
        }
      }

      // Fallback: if no tool calls, try to create a basic shape
      if (intents.length === 0) {
        intents.push({
          kind: 'create',
          type: 'rect',
          x: 100,
          y: 100,
        })
      }

      return intents
    } catch (error: any) {
      console.error('Provider parse error:', error)
      // Fallback to a basic operation
      return [{
        kind: 'create',
        type: 'rect',
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      }]
    }
  },
}
