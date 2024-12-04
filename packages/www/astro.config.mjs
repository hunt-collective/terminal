import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import solid from '@astrojs/solid-js'
import aws from 'astro-sst'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    tailwind({ applyBaseStyles: false }),
    solid(),
    starlight({
      title: 'Terminal',
      customCss: ['./src/styles/global.css'],
      components: {
        PageFrame: './src/components/page-frame.astro',
        Header: './src/components/header.astro',
      },
    }),
  ],
  server: { host: true },
  adapter: aws(),
  output: 'server',
  redirects: {
    '/report': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    '/feud': 'https://jean-types-icq-calls.trycloudflare.com',
  },
})
