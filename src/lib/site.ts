import { getCollection } from 'astro:content';

export const sections = ['projects', 'writing', 'research', 'curiosities', 'art', 'reading'] as const;
export type Section = (typeof sections)[number];

// group is the subfolder inside a section, if any: writing/technical/foo.mdx -> "technical"
export type Page = { title: string; href: string; section?: Section; group?: string };

type Dated = { data: { date: Date } };
export const byDate = (a: Dated, b: Dated) => b.data.date.valueOf() - a.data.date.valueOf();

export const shortDate = (d: Date) =>
  d.toLocaleDateString('en', { month: 'short', year: 'numeric' }).toLowerCase();

export const groupOf = (id: string) => (id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : undefined);

export async function entries() {
  const all = await Promise.all(sections.map((s) => getCollection(s, (e) => !e.data.draft)));
  return all.flat().sort(byDate);
}

export async function pages(): Promise<Page[]> {
  const all = await entries();
  const out: Page[] = sections.flatMap((s) =>
    all
      .filter((e) => e.collection === s)
      .map((e) => ({ title: e.data.title, href: `/${s}/${e.id}`, section: s, group: groupOf(e.id) })),
  );
  out.push({ title: 'about', href: '/about' }, { title: 'now', href: '/now' });
  return out;
}
