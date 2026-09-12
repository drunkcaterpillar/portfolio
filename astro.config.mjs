// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://sanyukta.xyz',
  integrations: [mdx()],

  // book covers come from goodreads and get optimized at build like local images
  image: { domains: ['i.gr-assets.com', 's.gr-assets.com'] },

  // keep styles in files so the content security policy can stay strict
  build: { inlineStylesheets: 'never' },

  vite: {
    plugins: [tailwindcss()]
  }
});