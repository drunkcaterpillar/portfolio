import { getCollection } from 'astro:content';

export const sections = ['projects', 'writing', 'research', 'art', 'reading'] as const;
export type Section = (typeof sections)[number];

export type Page = { title: string; href: string; section?: Section };

type Dated = { data: { date: Date } };
export const byDate = (a: Dated, b: Dated) => b.data.date.valueOf() - a.data.date.valueOf();

export const shortDate = (d: Date) =>
  d.toLocaleDateString('en', { month: 'short', year: 'numeric' }).toLowerCase();

export async function pages(): Promise<Page[]> {
  const out: Page[] = [];
  for (const s of sections) {
    const entries = await getCollection(s, (e) => !e.data.draft);
    for (const e of entries.sort(byDate)) {
      out.push({ title: e.data.title, href: `/${s}/${e.id}`, section: s });
    }
  }
  out.push({ title: 'about', href: '/about' }, { title: 'now', href: '/now' });
  return out;
}
