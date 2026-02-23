import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import reactSwc from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory and parent directories
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      // Use SWC for faster refresh in development
      reactSwc(),
      // Fallback to Babel-based plugin if SWC has issues
      react(),
    ],
    server: {
      port: 3000,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://django:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('Proxy error:', err)
            })
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('Proxying request:', req.method, req.url)
            })
          },
        },
      },
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            axios: ['axios'],
          },
        },
      },
    },
    // Optimize dependencies for faster startup
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
      esbuildOptions: {
        target: 'es2022',
      },
    },
  }
})