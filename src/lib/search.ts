// shared by the prompt and the grep: what counts as a match, and how hits get marked

export const parts = (q: string) => q.toLowerCase().trim().split(/\s+/).filter(Boolean);
export const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// each part of the query has to appear, in order, inside a single word of the target.
// dropped letters still match, letters strewn across different words do not
export const inWord = (q: string, word: string) => {
  let i = 0;
  for (const c of word) if (c === q[i]) i++;
  return i === q.length;
};
export const matches = (ps: string[], key: string) => {
  const ws = words(key);
  return ps.every((p) => ws.some((w) => inWord(p, w)));
};

// the words a query lands on, for marking
export const hits = (ps: string[], text: string) => [...new Set(words(text).filter((w) => ps.some((p) => inWord(p, w))))];

export function highlight(el: Element, ws: string[]) {
  if (ws.length === 0) return;
  const re = new RegExp(`\\b(${ws.join('|')})\\b`, 'gi');
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const text = node.data;
    if (!re.test(text)) continue;
    re.lastIndex = 0; // test moved it, and matchAll would start from there
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(re)) {
      frag.append(text.slice(last, m.index));
      const mark = document.createElement('mark');
      mark.textContent = m[0];
      frag.append(mark);
      last = m.index + m[0].length;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

export function unhighlight(el: Element) {
  for (const m of el.querySelectorAll('mark')) m.replaceWith(m.textContent ?? '');
  el.normalize();
}
