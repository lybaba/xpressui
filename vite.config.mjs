import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'xpressui',
      // the proper extensions will be added
      fileName: 'xpressui',
    },
  },
})
