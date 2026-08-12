import { resolve } from 'path'
import { defineConfig } from 'vite'

// Multi-page setup: QUEEKRAFT lives at /, DSM ARCHIVE lives at /dsm/.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dsm: resolve(__dirname, 'dsm/index.html'),
      },
    },
  },
})
