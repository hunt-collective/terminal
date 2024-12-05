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
      sidebar: [
        { slug: 'docs', label: 'Docs' },
        {
          label: 'Examples',
          autogenerate: { directory: 'examples' },
        },
        'contributing',
      ],
      components: {
        Head: './src/components/starlight/head.astro',
        PageFrame: './src/components/starlight/page-frame.astro',
        Header: './src/components/starlight/header.astro',
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
