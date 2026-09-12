import { getCollection } from 'astro:content';

export const sections = ['projects', 'research', 'writing', 'curiosities', 'art'] as const;
export type Section = (typeof sections)[number];

// group is the subfolder inside a section, if any: writing/notes/foo.mdx -> "notes"
export type Page = { title: string; href: string; section?: Section; group?: string };

type Sortable = { data: { date: Date; order?: number } };
export const inOrder = (a: Sortable, b: Sortable) => {
  if (a.data.order !== b.data.order) {
    if (a.data.order === undefined) return 1;
    if (b.data.order === undefined) return -1;
    return a.data.order - b.data.order;
  }
  return b.data.date.valueOf() - a.data.date.valueOf();
};

export const shortDate = (d: Date) =>
  d.toLocaleDateString('en', { month: 'short', year: 'numeric' }).toLowerCase();

export const groupOf = (id: string) => (id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : undefined);

// folders that want a display name, a blurb, or to show up before they have any pages
export const folders: Record<string, { label?: string; blurb?: string }> = {
  'writing/poetry': { label: 'poetry?' },
  'writing/unrefined-drifts': {
    label: 'unrefined drifts',
    blurb: 'here you will find raw, instinctual thought processes that have been forced out of my mind to free up processing power.',
  },
};

export const folderLabel = (section: string, group: string) => folders[`${section}/${group}`]?.label ?? group;

// groups found in the pages, in page order, then any configured folder that has none yet
export function groupsOf(section: string, found: (string | undefined)[]) {
  const configured = Object.keys(folders)
    .filter((k) => k.startsWith(section + '/'))
    .map((k) => k.slice(section.length + 1));
  return [...new Set([...found.filter((g): g is string => !!g), ...configured])];
}

export async function entries() {
  const all = await Promise.all(sections.map((s) => getCollection(s, (e) => !e.data.draft)));
  return all.flat().sort(inOrder);
}

export async function pages(): Promise<Page[]> {
  const all = await entries();
  const out: Page[] = sections.flatMap((s) =>
    all
      .filter((e) => e.collection === s)
      .map((e) => ({ title: e.data.short ?? e.data.title, href: `/${s}/${e.id}`, section: s, group: groupOf(e.id) })),
  );
  out.push({ title: 'about', href: '/about' }, { title: 'now', href: '/now' });
  return out;
}

// the shelf page's sections: what i'm reading now, then each year, newest first
export async function shelves() {
  const books = (await getCollection('shelf')).sort(inOrder);
  const ids = [...new Set(books.map((b) => groupOf(b.id) ?? ''))].sort((a, b) =>
    a === 'currently-reading' ? -1 : b === 'currently-reading' ? 1 : b.localeCompare(a),
  );
  return ids.map((id) => ({
    id,
    label: id === 'currently-reading' ? 'current shelf' : id,
    books: books.filter((b) => groupOf(b.id) === id),
  }));
}
