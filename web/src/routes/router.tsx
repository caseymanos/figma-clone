import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import { AuthGate } from '../auth/AuthGate'
import CanvasRoute from './CanvasRoute'
import RouteError from './RouteError'

export const router = createBrowserRouter([
  { path: '/', element: <AuthGate><App /></AuthGate>, errorElement: <RouteError /> },
  { path: '/c/:canvasId', element: <AuthGate><CanvasRoute /></AuthGate>, errorElement: <RouteError /> },
])
