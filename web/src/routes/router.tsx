import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import { AuthGate } from '../auth/AuthGate'
import CanvasRoute from './CanvasRoute'

export const router = createBrowserRouter([
  { path: '/', element: <AuthGate><App /></AuthGate> },
  { path: '/c/:canvasId', element: <AuthGate><CanvasRoute /></AuthGate> },
])
