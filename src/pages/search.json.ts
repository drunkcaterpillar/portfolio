import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { entries, groupOf, sections } from '../lib/site';

// the index the home prompt fetches on first use: every page with its text, markdown stripped
const plain = (md: string) =>
  md
    .replace(/^import .*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// about and now live in pages, not a collection, so their text comes straight from the files
const loose = import.meta.glob('./*.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const GET: APIRoute = async () => {
  const items = [
    ...sections.map((s) => ({ title: s, path: `${s}/`, href: `/${s}` })),
    { title: 'shelf', path: 'shelf/', href: '/shelf' },
    ...(await entries()).map((e) => ({
      title: e.data.title,
      path: `${e.collection}/${e.id}`,
      href: `/${e.collection}/${e.id}`,
      tags: e.data.tags,
      summary: 'summary' in e.data ? e.data.summary : undefined,
      text: plain(e.body ?? ''),
    })),
    ...Object.entries(loose).map(([file, raw]) => {
      const name = file.slice(2, -4);
      return { title: name, path: name, href: `/${name}`, text: plain(raw) };
    }),
    ...(await getCollection('shelf')).map((b) => ({
      title: b.data.title,
      path: `shelf/${groupOf(b.id)}/${b.id.split('/').pop()}`,
      href: `/shelf#${groupOf(b.id)}`,
      text: b.data.author,
    })),
  ];
  return new Response(JSON.stringify(items), { headers: { 'content-type': 'application/json' } });
};
