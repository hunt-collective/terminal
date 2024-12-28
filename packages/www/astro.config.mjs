import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import solid from '@astrojs/solid-js'
import aws from 'astro-sst'
import mdx from '@astrojs/mdx'
import remarkDirective from 'remark-directive'
import { remarkAsides } from './src/mdx/asides'
import { remarkVhs } from './src/mdx/vhs'

export default defineConfig({
  integrations: [
    mdx({
      syntaxHighlight: 'prism',
      remarkPlugins: [remarkDirective, remarkAsides, remarkVhs],
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
