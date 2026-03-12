import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        xpressui: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        hydrate: fileURLToPath(new URL('./src/hydrate.ts', import.meta.url)),
        standalone: fileURLToPath(new URL('./src/standalone.ts', import.meta.url)),
      },
      name: 'xpressui',
      fileName: (_format, entryName) => entryName,
    },
  },
})
