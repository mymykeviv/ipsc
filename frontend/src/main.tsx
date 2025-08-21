import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './modules/App'
import { AuthProvider } from './modules/AuthContext'
import './theme.css'

// Version tracking
const VERSION = "1.0.0"
const BUILD_DATE = "2024-01-15"

// Log version info
console.log(`ProfitPath Frontend v${VERSION} (${BUILD_DATE})`)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

