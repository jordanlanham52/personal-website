/* ===========================================================
   build-writeups.js
   Markdown -> HTML build for jordanlanham.com write-ups.

   Adapted from the Cyber Saguaros site build, rendered into
   this site's own design (styles.css / .article / .entry markup).

   Usage:
     npm install          # once, to get `marked`
     npm run build        # regenerate all write-up pages + indexes

   Authoring a write-up:
     1. Create writeups-src/ctf/<name>.md  (or writeups-src/disclosures/<name>.md)
     2. Start it with a metadata block (see writeups-src/_TEMPLATE.md)
     3. Run `npm run build`
   =========================================================== */

const fs = require('fs');
const path = require('path');

// marked exports differently across versions; handle both shapes.
let markedMod = require('marked');
const marked = markedMod.marked || markedMod;
if (typeof marked.setOptions === 'function') marked.setOptions({ gfm: true });
const parseMarkdown = (md) => (marked.parse ? marked.parse(md) : marked(md));

const ROOT = path.join(__dirname, '..');

// One entry per write-up collection on the site.
const COLLECTIONS = [
  {
    key: 'ctf',
    srcDir: path.join(ROOT, 'writeups-src', 'ctf'),
    outDir: path.join(ROOT, 'ctf'),
    urlBase: '/ctf',
    navCurrent: '/ctf/',
    backLabel: 'All CTF write-ups',
    emptyTitle: 'Write-ups coming soon',
    emptyCopy: 'Challenge breakdowns will be published here as I write them up.',
  },
  {
    key: 'disclosures',
    srcDir: path.join(ROOT, 'writeups-src', 'disclosures'),
    outDir: path.join(ROOT, 'disclosures'),
    urlBase: '/disclosures',
    navCurrent: '/disclosures/',
    backLabel: 'All disclosures',
    emptyTitle: 'Disclosures coming soon',
    emptyCopy: 'Advisories and bug-bounty write-ups will appear here once public disclosure is permitted.',
  },
];

// ---------- helpers -------------------------------------------------------

function slugify(name) {
  return name.replace(/\.md$/i, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toISO(dateStr) {
  if (!dateStr) return '';
  const t = Date.parse(dateStr);
  if (isNaN(t)) return '';
  return new Date(t).toISOString().slice(0, 10);
}

// Pull the leading metadata block (title + **Field:** lines) out of the markdown.
function extractMeta(md) {
  const meta = { title: null, author: null, event: null, category: null, date: null, readtime: null, summary: null, cve: null };
  const lines = md.split(/\r?\n/);
  const grab = (l, field) => {
    const re = new RegExp('^\\**' + field + ':\\**\\s*(.*)$', 'i');
    const m = l.replace(/\*\*/g, '**').match(re) || l.match(new RegExp('\\*\\*' + field + ':\\*\\*\\s*(.*)$', 'i'));
    return m ? m[1].replace(/\*\*/g, '').trim() : null;
  };
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const l = lines[i];
    if (!meta.title) { const m = l.match(/^#\s+(.*)$/); if (m) meta.title = m[1].trim(); }
    for (const f of ['author', 'event', 'category', 'date', 'summary', 'cve']) {
      if (!meta[f]) { const v = grab(l, f === 'cve' ? 'CVE' : f.charAt(0).toUpperCase() + f.slice(1)); if (v) meta[f] = v; }
    }
    if (!meta.readtime) { const v = grab(l, 'Read Time'); if (v) meta.readtime = v; }
  }
  return meta;
}

// Remove the leading metadata block so it isn't rendered twice in the body.
function stripHeaderBlock(md) {
  const lines = md.split(/\r?\n/);
  let hr = -1;
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    if (/^\s*---\s*$/.test(lines[i])) { hr = i; break; }
  }
  if (hr === -1) return md;
  const head = lines.slice(0, hr).join('\n');
  if (/^#\s+/m.test(head) || /\*\*(Author|Category|Event|Date|Read Time|CVE|Summary):/i.test(head)) {
    return lines.slice(hr + 1).join('\n').replace(/^\s+/, '');
  }
  return md;
}

// ---------- shared page chrome -------------------------------------------

function navHtml(current) {
  const item = (href, label) =>
    `<a href="${href}"${href === current ? ' class="current" aria-current="page"' : ''}>${label}</a>`;
  return `<header class="site-header">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">JL</span><span class="brand-text">Jordan Lanham</span></a>
  <nav class="nav" aria-label="Primary">
    ${item('/about/', 'About')}
    ${item('/ctf/', 'CTF write-ups')}
    ${item('/disclosures/', 'Disclosures')}
    ${item('/contact/', 'Contact')}
  </nav>
  <button id="menuToggle" class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false">Menu</button>
</header>`;
}

const FOOTER = `<footer class="site-footer">
  <p>&copy; <span id="year"></span> Jordan Lanham</p>
  <p class="footer-note">Security Researcher · Reverse Engineering &amp; Web Security</p>
</footer>`;

const HEAD_LINKS = `<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

function articlePage(col, slug, meta, contentHtml) {
  const iso = toISO(meta.date);
  const metaBits = [];
  if (meta.date) metaBits.push(`<time datetime="${esc(iso)}">${esc(meta.date)}</time>`);
  if (meta.cve) metaBits.push(`<span class="pill pill-cve">${esc(meta.cve)}</span>`);
  if (meta.category) metaBits.push(`<span class="pill">${esc(meta.category)}</span>`);
  if (meta.readtime) metaBits.push(`<span class="meta-readtime">${esc(meta.readtime)}</span>`);

  const byParts = [];
  if (meta.author) byParts.push(esc(meta.author));
  if (meta.event) byParts.push(esc(meta.event));
  const byline = byParts.length ? `<p class="article-byline">${byParts.join(' &middot; ')}</p>` : '';

  const canonical = `https://jordanlanham.com${col.urlBase}/${slug}/`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(meta.title)} — Jordan Lanham</title>
  <meta name="description" content="${esc(meta.summary || meta.title)}">
  <link rel="canonical" href="${canonical}">
  ${HEAD_LINKS}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${navHtml(col.navCurrent)}
<main id="main" class="page article">
  <a class="back-link" href="${col.urlBase}/">&larr; ${col.backLabel}</a>
  <header class="page-head">
    <div class="entry-meta entry-meta-inline">${metaBits.join('')}</div>
    <h1>${esc(meta.title)}</h1>
    ${meta.summary ? `<p class="page-lede">${esc(meta.summary)}</p>` : ''}
    ${byline}
  </header>
  <div class="prose">
${contentHtml}
  </div>
</main>
${FOOTER}
<script src="/script.js"></script>
</body>
</html>
`;
}

// A single card/row for an index page, in this site's .entry style.
function entryRow(col, card) {
  const pill = card.cve
    ? `<span class="pill pill-cve">${esc(card.cve)}</span>`
    : (card.category ? `<span class="pill">${esc(card.category)}</span>` : '');
  const meta = (card.date || pill)
    ? `<div class="entry-meta">${card.date ? `<time datetime="${esc(card.iso)}">${esc(card.date)}</time>` : ''}${pill}</div>`
    : '';
  return `    <li class="entry">
      ${meta}
      <div class="entry-body">
        <h3><a href="${card.href}">${esc(card.title)}</a></h3>
        ${card.summary ? `<p>${esc(card.summary)}</p>` : ''}
      </div>
    </li>`;
}

function emptyRow(col) {
  return `    <li class="entry entry-empty">
      <div class="entry-body">
        <h3>${esc(col.emptyTitle)}</h3>
        <p>${esc(col.emptyCopy)}</p>
      </div>
    </li>`;
}

// Replace the block between <!-- WRITEUPS:START --> and <!-- WRITEUPS:END -->.
function injectIntoIndex(indexFile, listHtml) {
  if (!fs.existsSync(indexFile)) { console.warn('  ! index not found:', indexFile); return; }
  const html = fs.readFileSync(indexFile, 'utf8');
  const START = '<!-- WRITEUPS:START -->';
  const END = '<!-- WRITEUPS:END -->';
  const s = html.indexOf(START);
  const e = html.indexOf(END, s);
  if (s === -1 || e === -1) {
    console.warn('  ! markers WRITEUPS:START/END missing in', indexFile);
    return;
  }
  const before = html.slice(0, s + START.length);
  const after = html.slice(e);
  fs.writeFileSync(indexFile, `${before}\n${listHtml}\n    ${after}`, 'utf8');
}

// ---------- main ----------------------------------------------------------

function buildCollection(col) {
  const indexFile = path.join(col.outDir, 'index.html');
  let cards = [];

  if (fs.existsSync(col.srcDir)) {
    const files = fs.readdirSync(col.srcDir).filter(f => f.toLowerCase().endsWith('.md') && !f.startsWith('_'));
    files.forEach(file => {
      const md = fs.readFileSync(path.join(col.srcDir, file), 'utf8');
      const meta = extractMeta(md);
      meta.title = meta.title || file.replace(/\.md$/i, '');
      const slug = slugify(file);
      const body = parseMarkdown(stripHeaderBlock(md));

      const outDir = path.join(col.outDir, slug);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), articlePage(col, slug, meta, body), 'utf8');
      console.log(`  wrote ${col.urlBase}/${slug}/`);

      const iso = toISO(meta.date);
      cards.push({
        href: `${col.urlBase}/${slug}/`,
        title: meta.title,
        summary: meta.summary || '',
        category: meta.category || '',
        cve: meta.cve || '',
        date: meta.date || '',
        iso,
        sort: iso ? Date.parse(iso) : fs.statSync(path.join(col.srcDir, file)).mtimeMs,
      });
    });
  }

  cards.sort((a, b) => b.sort - a.sort); // newest first
  const listHtml = cards.length ? cards.map(c => entryRow(col, c)).join('\n') : emptyRow(col);
  injectIntoIndex(indexFile, listHtml);
  console.log(`  ${col.key}: ${cards.length} write-up(s) -> ${path.relative(ROOT, indexFile)}`);
}

console.log('Building write-ups...');
COLLECTIONS.forEach(buildCollection);
console.log('Done.');
