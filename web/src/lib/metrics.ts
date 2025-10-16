type MetricEvent = {
  name: string
  atMs: number
  props?: Record<string, unknown>
}

const buffer: MetricEvent[] = []

export function trackAIEvent(name: string, props?: Record<string, unknown>) {
  buffer.push({ name, atMs: Date.now(), props })
  // For now, log to console for visibility; can be replaced with real sink.
  // eslint-disable-next-line no-console
  console.debug('[AI_METRIC]', name, props)
}

export function getBufferedMetrics() {
  return [...buffer]
}


