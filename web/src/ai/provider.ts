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
          if (!line.trim()) continue
          
          // Data stream format: lines start with data part identifier like "0:", "2:", "8:", etc.
          let json: any
          try {
            // Try parsing with prefix
            if (line.includes(':')) {
              const colonIndex = line.indexOf(':')
              json = JSON.parse(line.slice(colonIndex + 1))
            } else {
              json = JSON.parse(line)
            }
            
            console.log('Stream event:', json.type || json, json)
            
            // Extract tool calls from the data stream
            // Data stream format sends tool-call events
            if (json.type === 'tool-call' || json.type === 'tool_call') {
              console.log('Tool call found:', json.toolName, json.args)
              toolCalls.push(json)
            }
          } catch (e) {
            console.warn('Failed to parse stream line:', line.substring(0, 100))
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

      // No fallback - if AI didn't call tools, we should fail clearly
      if (intents.length === 0) {
        console.warn('No tool calls extracted from AI response')
        throw new Error('AI did not generate any valid tool calls. Try rephrasing your request.')
      }

      console.log('Parsed intents:', intents)
      return intents
    } catch (error: any) {
      console.error('Provider parse error:', error)
      throw error // Don't silently create fallback shape
    }
  },
}
