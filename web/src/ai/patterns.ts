import { aiTools, CanvasId, ShapeId } from './tools'

export async function buildLoginForm(canvasId: CanvasId, x: number = 100, y: number = 100) {
  await aiTools.createShape({ type: 'text', x, y, text: 'Username', fill: '#000000' }, canvasId)
  const userInput = await aiTools.createShape({ type: 'rect', x, y: y + 30, width: 260, height: 36, fill: '#ffffff' }, canvasId)
  await aiTools.createShape({ type: 'text', x, y: y + 80, text: 'Password', fill: '#000000' }, canvasId)
  const passInput = await aiTools.createShape({ type: 'rect', x, y: y + 110, width: 260, height: 36, fill: '#ffffff' }, canvasId)
  const submit = await aiTools.createShape({ type: 'rect', x, y: y + 160, width: 120, height: 40, fill: '#4f46e5' }, canvasId)
  await aiTools.createShape({ type: 'text', x: x + 18, y: y + 168, text: 'Sign In', fill: '#ffffff' }, canvasId)
  await aiTools.arrangeRow([userInput, passInput, submit], 12, canvasId)
}

export async function buildNavbar(canvasId: CanvasId, x: number = 100, y: number = 60, items: number = 4) {
  const ids: ShapeId[] = [] as any
  for (let i = 0; i < items; i++) {
    const id = await aiTools.createShape({ type: 'text', x, y, text: `Item ${i + 1}`, fill: '#000000' }, canvasId)
    ids.push(id)
  }
  await aiTools.arrangeRow(ids, 32, canvasId)
}

export async function buildCard(canvasId: CanvasId, x: number = 100, y: number = 100) {
  const card = await aiTools.createShape({ type: 'rect', x, y, width: 320, height: 200, fill: '#ffffff' }, canvasId)
  await aiTools.createShape({ type: 'text', x: x + 16, y: y + 16, text: 'Title', fill: '#000000' }, canvasId)
  await aiTools.createShape({ type: 'rect', x: x + 16, y: y + 48, width: 120, height: 80, fill: '#e5e7eb' }, canvasId)
  await aiTools.createShape({ type: 'text', x: x + 16, y: y + 140, text: 'Description...', fill: '#374151' }, canvasId)
  return card
}


