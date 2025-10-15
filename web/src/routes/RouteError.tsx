import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

export default function RouteError() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred.'
  let statusText: string | undefined

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = (error.data as any)?.message || message
    statusText = error.statusText
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '8px 0' }}>{title}</h2>
      <p style={{ margin: '8px 0', opacity: 0.8 }}>{message}</p>
      {statusText ? <p style={{ margin: '8px 0', opacity: 0.6 }}>{statusText}</p> : null}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => window.location.reload()}>Reload</button>
        <Link to="/">Go home</Link>
      </div>
    </div>
  )
}


