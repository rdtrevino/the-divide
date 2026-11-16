// The rulebook, straight from the repository's rules/ folder, so the site always shows the current rules.
import { marked } from 'marked';
import { useEffect, useMemo } from 'preact/hooks';
import { Site } from '../components/Site';
import source from '../../../../../rules/The_Divide_Rulebook_v8.md?raw';

// On the site, the rulebook's version line is left out (it is for the designer) and its opening
// subtitle reads the same as the front page.
const raw = source
  .replace(/^\*\*Version:\*\*.*\n/m, '')
  .replace(/^\*A game of divine ambition[^\n]*\*$/m, '*A card game for 3 to 6 players*');

const slug = (text: string) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function Rules() {
  const { html, toc } = useMemo(() => {
    const toc: { id: string; text: string }[] = [];
    const renderer = new marked.Renderer();
    renderer.heading = function ({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const text = inner.replace(/<[^>]+>/g, '');
      const id = slug(text);
      if (depth === 2) toc.push({ id, text });
      return `<h${depth} id="${id}">${inner}</h${depth}>`;
    };
    const html = marked.parse(raw, { renderer, async: false }) as string;
    return { html, toc };
  }, []);
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);
  return (
    <Site>
      <div class="rules">
        <nav class="rules-toc panel">
          <div class="eyebrow">Contents</div>
          {toc.map((t) => <a href={`#${t.id}`}>{t.text}</a>)}
        </nav>
        <article class="prose">
          <p class="rules-note panel">This site plays the <b>Open Game</b> for 3 or 4 players. Hidden Roles (5 or 6 players) is described below but is not playable online yet.</p>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </Site>
  );
}
