import { useNavigate } from 'react-router-dom'
import './App.css'
import { createCanvasWithMembership } from './lib/canvasService'

function App() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 24 }}>
      <h1>CollabCanvas</h1>
      <p>Create a canvas to start collaborating.</p>
      <button onClick={async () => { const id = await createCanvasWithMembership('Untitled'); navigate(`/c/${id}`) }}>Create new canvas</button>
    </div>
  )
}

export default App
