import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';

const mdx = (dir: string) => glob({ base: `src/content/${dir}`, pattern: '**/*.mdx' });

// the shelf is my goodreads account, read from its rss at build time. a book lands under
// currently-reading or under the year i finished it, which comes from the month shelf i file
// it on (january-2026, aug-2026, ...). older reads without a month shelf are left out.
const feed = (shelf: string) => `https://www.goodreads.com/review/list_rss/30853796?shelf=${shelf}&per_page=200`;

const field = (item: string, tag: string) =>
  item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))?.[1]?.trim() ?? '';

const plain = (html: string) =>
  html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const slug = (s: string) => s.trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const goodreads: Loader = {
  name: 'goodreads',
  async load({ store, parseData }) {
    store.clear();
    for (const shelf of ['currently-reading', 'read']) {
      const res = await fetch(feed(shelf));
      if (!res.ok) throw new Error(`goodreads ${shelf} feed: ${res.status}`);
      const xml = await res.text();
      for (const item of xml.split('<item>').slice(1)) {
        const year = field(item, 'user_shelves').match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*-(\d{4})/)?.[1];
        if (shelf === 'read' && !year) continue;
        const title = plain(field(item, 'title')).toLowerCase();
        const id = `${shelf === 'read' ? year : shelf}/${slug(title.split(':')[0])}`;
        const data = await parseData({
          id,
          data: {
            title,
            author: field(item, 'author_name'),
            date: field(item, 'user_read_at') || field(item, 'user_date_added'),
            cover: field(item, 'book_large_image_url'),
            link: field(item, 'link').split('?')[0],
          },
        });
        store.set({ id, data });
      }
    }
  },
};

// tags double as urls, so keep them url-shaped
const base = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens only')).default([]),
  draft: z.boolean().default(false),
  // pages with an order come first, ascending; the rest fall back to newest-first
  order: z.number().optional(),
  // what the tree and palette show when the title runs long
  short: z.string().optional(),
});

const projects = defineCollection({
  loader: mdx('projects'),
  schema: base.extend({
    summary: z.string(),
    repo: z.url().optional(),
    link: z.url().optional(),
  }),
});

// canonical points at the original when a piece was first published elsewhere
const writing = defineCollection({
  loader: mdx('writing'),
  schema: base.extend({
    summary: z.string(),
    canonical: z.url().optional(),
  }),
});

const research = defineCollection({
  loader: mdx('research'),
  schema: base.extend({ summary: z.string() }),
});

const curiosities = defineCollection({
  loader: mdx('curiosities'),
  schema: base.extend({
    summary: z.string().optional(),
    canonical: z.url().optional(),
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

const shelf = defineCollection({
  loader: goodreads,
  schema: base.extend({ author: z.string(), cover: z.url(), link: z.url() }),
});

export const collections = { projects, writing, research, curiosities, art, shelf };
