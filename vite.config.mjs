import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        xpressui: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      formats: ['es', 'umd'],
      name: 'xpressui',
      fileName: (format, entryName) => format === 'es' ? `${entryName}.mjs` : `${entryName}.umd.js`,
    },
  },
})
