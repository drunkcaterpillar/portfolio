import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const mdx = (dir: string) => glob({ base: `src/content/${dir}`, pattern: '**/*.mdx' });

const base = z.object({
  title: z.string(),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
});

const projects = defineCollection({
  loader: mdx('projects'),
  schema: base.extend({
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    repo: z.url().optional(),
    link: z.url().optional(),
  }),
});

const writing = defineCollection({
  loader: mdx('writing'),
  schema: base.extend({
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

const research = defineCollection({
  loader: mdx('research'),
  schema: base.extend({
    summary: z.string(),
    authors: z.array(z.string()),
    venue: z.string().optional(),
    pdf: z.url().optional(),
  }),
});

const curiosities = defineCollection({
  loader: mdx('curiosities'),
  schema: base.extend({
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const art = defineCollection({
  loader: mdx('art'),
  schema: ({ image }) =>
    base.extend({
      cover: image(),
      alt: z.string(),
      medium: z.string().optional(),
    }),
});

const reading = defineCollection({
  loader: mdx('reading'),
  schema: base.extend({
    author: z.string(),
    rating: z.number().int().min(1).max(5).optional(),
  }),
});

export const collections = { projects, writing, research, curiosities, art, reading };
