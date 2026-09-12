import { getCollection } from 'astro:content';

export const sections = ['projects', 'research', 'writing', 'curiosities', 'art', 'shelf'] as const;
export type Section = (typeof sections)[number];

// group is the subfolder inside a section, if any: writing/notes/foo.mdx -> "notes"
export type Page = { title: string; href: string; section?: Section; group?: string };

type Sortable = { data: { date: Date; order?: number } };
export const inOrder = (a: Sortable, b: Sortable) => {
  if (a.data.order !== undefined && b.data.order !== undefined) return a.data.order - b.data.order;
  if (a.data.order !== undefined) return -1;
  if (b.data.order !== undefined) return 1;
  return b.data.date.valueOf() - a.data.date.valueOf();
};

export const shortDate = (d: Date) =>
  d.toLocaleDateString('en', { month: 'short', year: 'numeric' }).toLowerCase();

export const groupOf = (id: string) => (id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : undefined);

export async function entries() {
  const all = await Promise.all(sections.map((s) => getCollection(s, (e) => !e.data.draft)));
  return all.flat().sort(inOrder);
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
