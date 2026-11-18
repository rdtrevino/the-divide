// The rulebook, straight from the repository's rules/ folder, so the site always shows the current rules.
// Shown in sections, with the long reference parts folded, and a search that finds any rule or card.
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Site } from '../components/Site';
import { Link } from '../lib/router';
import source from '../../../../../rules/The_Divide_Rulebook_v13.md?raw';

// The rulebook's version line is for the designer, not for players.
const raw = source.replace(/^\*\*Version:\*\*.*\n/m, '');

const slug = (text: string) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const plain = (md: string) => md.replace(/\*\*|\*|_|`|^#+\s*|^>\s*/gm, '').trim();
/** Reference sections start folded; open them from the contents or by searching. */
const FOLDED = new Set(['rulings', 'hidden-roles', 'glossary']);

interface Section { id: string; title: string; md: string; html: string }

function parse(): { intro: string; sections: Section[] } {
  const parts = raw.split(/\n(?=## )/);
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const inner = this.parser.parseInline(tokens);
    return `<h${depth} id="${slug(inner)}">${inner}</h${depth}>`;
  };
  const render = (md: string) => marked.parse(md, { renderer, async: false }) as string;
  // The credits under the title are one per line.
  const intro = marked.parse(parts[0].replace(/^---\s*$/gm, ''), { renderer, async: false, breaks: true }) as string;
  const sections = parts.slice(1).map((p) => {
    const [first, ...rest] = p.split('\n');
    const title = plain(first.replace(/^##\s*/, ''));
    const md = rest.join('\n').replace(/^---\s*$/gm, '');
    return { id: slug(title), title, md, html: render(md) };
  });
  return { intro, sections };
}

interface Hit { section: Section; html: string }

function search(sections: Section[], q: string): Hit[] {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const hits: Hit[] = [];
  for (const s of sections) {
    // Paragraphs, list items and table rows are the units a rule lives in.
    const blocks = s.md.split(/\n\s*\n|\n(?=\* )|\n(?=\| \*\*)|\n(?=\d\. )/).map((b) => b.trim()).filter((b) => b && !/^#/.test(b) && !/^\|\s*-/.test(b));
    for (const b of blocks) {
      const text = plain(b).toLowerCase();
      if (words.every((w) => text.includes(w))) {
        let html = marked.parseInline(b.replace(/^\* /, '').replace(/^\|\s*|\s*\|$/g, '').replace(/\s*\|\s*/g, ' · ')) as string;
        for (const w of words) html = html.replace(new RegExp(`(?![^<]*>)(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
        hits.push({ section: s, html });
      }
    }
  }
  return hits.slice(0, 40);
}

export function Rules() {
  const { intro, sections } = useMemo(parse, []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  // On phones the contents list folds away; it opens with a tap.
  const [tocOpen, setTocOpen] = useState(false);
  const hits = useMemo(() => search(sections, q), [sections, q]);
  const show = (id: string) => {
    setOpen((o) => new Set(o).add(id));
    setQ('');
    requestAnimationFrame(() => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id && sections.some((s) => s.id === id)) show(id);
  }, []);

  // The section being read: the last one whose heading has scrolled past the top of the window.
  const [current, setCurrent] = useState(sections[0]?.id ?? '');
  const searching = q.trim().length > 1;
  useEffect(() => {
    if (searching) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let at = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(`sec-${s.id}`);
        if (el && el.getBoundingClientRect().top <= 140) at = s.id;
      }
      // At the very bottom of the page, the last section counts as read even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) at = sections[sections.length - 1]?.id ?? at;
      setCurrent(at);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [sections, searching, open]);
  // Keep the highlighted entry visible in the contents list.
  useEffect(() => {
    document.querySelector('.rules-toc a.on')?.scrollIntoView({ block: 'nearest' });
  }, [current]);
  return (
    <Site>
      <div class="rules">
        <nav class={`rules-toc panel${tocOpen ? ' open' : ''}`}>
          <button class="rules-toc-head" aria-expanded={tocOpen} onClick={() => setTocOpen(!tocOpen)}>
            <span class="eyebrow">Contents</span>
            <span class="rules-toc-current">{sections.find((x) => x.id === current)?.title}</span>
          </button>
          <div class="rules-toc-list">
            {sections.map((s) => (
              <a href={`#${s.id}`} class={!searching && current === s.id ? 'on' : ''} aria-current={!searching && current === s.id ? 'true' : undefined} onClick={(e) => { e.preventDefault(); history.replaceState(null, '', `#${s.id}`); setTocOpen(false); show(s.id); }}>{s.title}</a>
            ))}
          </div>
        </nav>
        <article class="prose">
          <div class="rules-intro" dangerouslySetInnerHTML={{ __html: intro }} />
          <Link href="/learn" class="learn-cta">New to The Divide? <b>Learn to play in 5 minutes →</b></Link>
          <p class="rules-note">This site plays the <b>Open Game</b> for 3 or 4 players. Hidden Roles (5 or 6 players) is described below but is not playable online yet.</p>
          <div class="rules-search">
            <input class="field" type="search" value={q} placeholder="Look up a rule or a card: Tide, Exalt, Mirage…" aria-label="Search the rules" onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
          </div>
          {searching ? (
            <div class="rules-hits">
              <p class="muted">{hits.length ? `${hits.length}${hits.length === 40 ? '+' : ''} place${hits.length === 1 ? '' : 's'} in the rules mention “${q.trim()}”.` : `Nothing in the rules mentions “${q.trim()}”.`}</p>
              {hits.map((h) => (
                <div class="rules-hit">
                  <button class="rules-hit-where" onClick={() => show(h.section.id)}>{h.section.title} →</button>
                  <div dangerouslySetInnerHTML={{ __html: h.html }} />
                </div>
              ))}
            </div>
          ) : (
            sections.map((s) => {
              const folded = FOLDED.has(s.id) && !open.has(s.id);
              return (
                <section id={`sec-${s.id}`} class={`rules-sec${folded ? ' folded' : ''}`}>
                  <h2 id={s.id}>
                    {FOLDED.has(s.id) ? (
                      <button class="rules-fold" aria-expanded={!folded} onClick={() => setOpen((o) => { const n = new Set(o); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })}>
                        {s.title}<span>{folded ? 'Show' : 'Hide'}</span>
                      </button>
                    ) : s.title}
                  </h2>
                  {folded ? <p class="muted rules-folded-note">{s.id === 'rulings' ? 'How specific cards work, grouped by topic. Search above to find a card.' : s.id === 'glossary' ? 'Every game term, A to Z.' : 'The 5 and 6 player mode with secret factions.'}</p> : <div dangerouslySetInnerHTML={{ __html: s.html }} />}
                </section>
              );
            })
          )}
        </article>
      </div>
    </Site>
  );
}
