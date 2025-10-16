import { aiTools } from './tools'
import { provider } from './provider'
import { buildLoginForm } from './patterns'
import { trackAIEvent } from '../lib/metrics'

export interface AgentRunOptions {
  canvasId: string
  selectedIds?: string[]
}

export interface AgentStep {
  description: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

export interface AgentResult {
  steps: AgentStep[]
}

export async function runAgent(prompt: string, options: AgentRunOptions): Promise<AgentResult> {
  const steps: AgentStep[] = []
  const push = (d: string) => {
    const s: AgentStep = { description: d, status: 'pending' }
    steps.push(s)
    return s
  }

  try {
    trackAIEvent('agent.run.start', { promptLength: prompt.length })
    const intents = await provider.parse(prompt, {
      canvasId: options.canvasId,
      selectedIds: options.selectedIds,
    })
    trackAIEvent('agent.intent.parsed', { count: intents.length })
    
    // Execute each intent sequentially
    for (const intent of intents) {
      trackAIEvent('agent.intent.execute', { kind: (intent as any).kind })
      switch (intent.kind) {
        case 'create': {
        const s = push('Creating shape')
        await aiTools.createShape({
          type: intent.type,
          x: intent.x ?? 100,
          y: intent.y ?? 100,
          width: intent.width,
          height: intent.height,
          fill: intent.color,
          text: intent.text,
        }, options.canvasId)
        s.status = 'success'
        break
      }
      case 'move': {
        const s = push('Moving shape')
        await aiTools.moveShape(intent.id, intent.x, intent.y)
        s.status = 'success'
        break
      }
      case 'resize': {
        const s = push('Resizing shape')
        await aiTools.resizeShape(intent.id, intent.width, intent.height)
        s.status = 'success'
        break
      }
      case 'rotate': {
        const s = push('Rotating shape')
        await aiTools.rotateShape(intent.id, intent.degrees)
        s.status = 'success'
        break
      }
      case 'layout-row': {
        const ids = intent.ids && intent.ids.length ? intent.ids : (options.selectedIds || [])
        if (ids.length) {
          const s = push('Arranging in row')
          await aiTools.arrangeRow(ids, intent.spacing ?? 16, options.canvasId)
          s.status = 'success'
        }
        break
      }
      case 'layout-grid': {
        const ids = intent.ids && intent.ids.length ? intent.ids : (options.selectedIds || [])
        if (ids.length) {
          const s = push('Arranging grid')
          await aiTools.arrangeGrid(ids, intent.rows, intent.cols, options.canvasId, undefined, undefined, intent.gap)
          s.status = 'success'
        }
        break
      }
      case 'distribute': {
        const ids = intent.ids && intent.ids.length ? intent.ids : (options.selectedIds || [])
        if (ids.length) {
          const s = push('Distributing')
          await aiTools.distribute(ids, intent.axis, options.canvasId, intent.spacing)
          s.status = 'success'
        }
        break
      }
      case 'pattern-login': {
        const s = push('Creating login form')
        await buildLoginForm(options.canvasId, intent.x, intent.y)
        s.status = 'success'
        break
      }
      default: {
        const s = push('Unknown command')
        s.status = 'success'
      }
    }
    }
  } catch (e: any) {
    steps.push({ description: 'Agent failed', status: 'error', error: e?.message || String(e) })
    trackAIEvent('agent.run.error', { message: e?.message || String(e) })
  }
  trackAIEvent('agent.run.end', { stepCount: steps.length })
  return { steps }
}


