import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './state/AppState.tsx'
import { AuthProvider } from './state/Auth.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppStateProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AppStateProvider>
    </AuthProvider>
  </StrictMode>,
)
