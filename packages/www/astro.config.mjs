import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import solid from '@astrojs/solid-js'
import aws from 'astro-sst'
import mdx from '@astrojs/mdx'

export default defineConfig({
  integrations: [
    mdx({
      syntaxHighlight: 'prism',
    }),
    tailwind({ applyBaseStyles: false }),
    solid(),
  ],
  server: { host: true },
  adapter: aws(),
  output: 'server',
  redirects: {
    '/report': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    '/feud': 'https://jean-types-icq-calls.trycloudflare.com',
  },
})
