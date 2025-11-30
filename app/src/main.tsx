import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// StrictMode désactivé : incompatible avec Sigma.js (WebGL double-init)
createRoot(document.getElementById('root')!).render(<App />)
