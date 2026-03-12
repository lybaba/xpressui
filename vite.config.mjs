import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        xpressui: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      formats: ['es'],
      name: 'xpressui',
      fileName: (_format, entryName) => `${entryName}.mjs`,
    },
  },
})
