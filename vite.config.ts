import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true'

  return {
    plugins: [
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      ...(isTest
        ? []
        : [
            devtools(),
            tanstackStart(),
            nitro({
              preset: 'vercel',
              vercel: {
                functions: {
                  runtime: 'nodejs22.x',
                },
              },
            }),
          ]),
      viteReact(),
    ],
  }
})

export default config
