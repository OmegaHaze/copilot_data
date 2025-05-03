import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './theme.css'

// Log all debug messages during development
console.log('Debug mode: All console logs enabled')

// Set up global error handler to catch and display details about uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
