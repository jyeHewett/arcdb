import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production'
  return {
    base: '/arcdb/',
    publicPath: process.env.NODE_ENV === "production" ? "/arcdb/" : "/",
    plugins: [
      vue(),
      // include devtools only in non-production modes
      !isProd && vueDevTools(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: {
      // produce smaller production builds
      sourcemap: false,
    }
  }
})
