import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Helper function: bypass API proxy for browser HTML navigation requests
// When a user navigates or refreshes routes like /tickets or /tickets/new in the browser,
// the browser sends 'Accept: text/html...'. Returning '/index.html' lets Vite serve
// the React SPA so React Router can render the correct page component.
// API calls made via Axios/fetch send 'Accept: application/json' and continue to FastAPI.
const bypassHtml = (req) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return '/index.html';
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: bypassHtml,
      },
      '/projects': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: bypassHtml,
      },
      '/tickets': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: bypassHtml,
      },
    },
  },
})
