#!/usr/bin/env node
/*
  Griv static site builder — no dependencies.

  Pages live in src/pages. Each starts with a header comment:
    <!--page {"title": "...", "description": "...", "nav": "dark" | "light", "scripts": ["/js/demos.js"]} -->
  followed by the page's <main> content.

  Output: src/pages/index.html            → index.html
          src/pages/about.html            → about/index.html
          src/pages/products/invoices.html → products/invoices/index.html

  Partials (src/partials) are included with:  <!--@include name key="value"-->
  Values from src/site.config.json are available as {{signup}}, {{login}}, {{docs.apiReference}}, ...

  Run:  node tools/build.mjs
*/
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const config = JSON.parse(readFileSync(join(SRC, 'site.config.json'), 'utf8'));
const partial = (name) => readFileSync(join(SRC, 'partials', name + '.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/* ---------- Generated blocks (rendered from site.config.json) ---------- */
const blocks = {
  pricing_table() {
    const { groups = [] } = config.pricing || {};
    return groups.map((g) => `
      <div class="price-group reveal">
        <h3 class="price-gh">${esc(g.name)}</h3>
        <ul class="price-list">${g.items.map((it) => `
          <li>
            <span class="pl-name"><a href="${esc(it.href)}">${esc(it.product)}</a><small>${esc(it.what)}</small></span>
            <span class="pl-price${it.price ? '' : ' tba'}">${it.price ? esc(it.price) : 'Published at launch'}${it.detail ? `<small>${esc(it.detail)}</small>` : ''}</span>
          </li>`).join('')}
        </ul>
      </div>`).join('');
  },
  careers_roles() {
    const roles = (config.careers && config.careers.roles) || [];
    if (!roles.length) {
      return `<div class="roles-empty reveal">
        <svg class="re-mark" aria-hidden="true"><use href="#mark"/></svg>
        <h3>No open roles right now</h3>
        <p>We’re not hiring for specific positions at the moment. If you’d like to be considered when we are, send us a note about what you do and the problems you’d like to work on.</p>
        <a class="btn" href="/contact/?topic=careers">Express your interest <svg class="ic"><use href="#i-chev"/></svg></a>
      </div>`;
    }
    return `<ul class="roles">${roles.map((r) => `
      <li class="reveal"><a href="${esc(r.url)}"><span><b>${esc(r.title)}</b><small>${esc(r.team)} · ${esc(r.location)}</small></span><svg class="ic"><use href="#i-chev"/></svg></a></li>`).join('')}</ul>`;
  },
  security_certifications() {
    const certs = (config.security && config.security.certifications) || [];
    if (!certs.length) return '';
    return `<section class="sec"><div class="wrap"><header class="sec-head reveal"><p class="eyebrow">Certifications</p><h2 class="h2 h2-sm">Independently verified</h2></header>
      <ul class="cert-list">${certs.map((c) => `<li class="reveal"><b>${esc(c.name)}</b><small>${esc(c.detail || '')}</small></li>`).join('')}</ul></div></section>`;
  },
};

/* ---------- Templating ---------- */
const fill = (html, vars) => html.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
  if (k in vars) return vars[k];
  if (k in blocks) return blocks[k]();
  const v = get(config, k);
  return v === undefined ? m : String(v);
});
const includes = (html) => html.replace(/<!--@include\s+([\w-]+)([^>]*)-->/g, (m, name, attrs) => {
  const vars = {};
  attrs.replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => (vars[k] = v));
  return includes(fill(partial(name), vars));
});

/* ---------- Collect pages ---------- */
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : f.endsWith('.html') ? [p] : [];
});
const pages = walk(join(SRC, 'pages')).map((file) => {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^<!--page\s+(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`Missing <!--page {...}--> header in ${relative(ROOT, file)}`);
  const meta = JSON.parse(m[1]);
  const rel = relative(join(SRC, 'pages'), file).replace(/\\/g, '/').replace(/\.html$/, '');
  const route = rel === 'index' ? '/' : rel === '404' ? '/404' : '/' + rel.replace(/\/index$/, '') + '/';
  const out = route === '/' ? 'index.html' : route === '/404' ? '404.html' : route.slice(1) + 'index.html';
  return { file, meta, body: raw.slice(m[0].length), route, out };
});

/* ---------- Render ---------- */
const layout = partial('layout');
for (const pg of pages) {
  const { meta } = pg;
  const scripts = ['/js/site.js', ...(meta.scripts || [])].map((s) => `<script src="${s}" defer></script>`).join('\n');
  let html = fill(layout, {
    title: esc(meta.title),
    description: esc(meta.description || ''),
    themeColor: meta.nav === 'dark' ? '#291107' : '#FFFFFF',
    nav: meta.nav === 'dark' ? 'dark' : 'light',
    bodyClass: esc(meta.bodyClass || ''),
    sprite: partial('sprite'),
    header: partial('header'),
    footer: partial('footer'),
    content: pg.body,
    scripts,
  });
  html = fill(includes(html), {});
  // Mark the current page in the navigation.
  if (pg.route !== '/') html = html.split(`href="${pg.route}"`).join(`href="${pg.route}" aria-current="page"`);
  const dest = join(ROOT, pg.out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
}

/* ---------- Check internal links and in-page anchors ---------- */
const problems = [];
for (const pg of pages) {
  const html = readFileSync(join(ROOT, pg.out), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
    if (href === '#' || /^(https?:|mailto:|tel:)/.test(href)) continue;
    if (href.startsWith('#')) { if (!ids.has(href.slice(1))) problems.push(`${pg.route}: missing anchor ${href}`); continue; }
    const [path, hash] = href.split('#');
    const clean = path.split('?')[0];
    const target = clean === '/' ? 'index.html' : clean.replace(/^\//, '') + (clean.endsWith('/') ? 'index.html' : '');
    if (!existsSync(join(ROOT, target))) { problems.push(`${pg.route}: broken link ${href}`); continue; }
    if (hash) {
      const other = readFileSync(join(ROOT, target), 'utf8');
      if (!other.includes(`id="${hash}"`)) problems.push(`${pg.route}: missing anchor ${href}`);
    }
  }
  if (/\{\{[\w.]+\}\}/.test(html)) problems.push(`${pg.route}: unresolved template token ${html.match(/\{\{[\w.]+\}\}/)[0]}`);
}
console.log(`Built ${pages.length} pages.`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; } else console.log('Links: all internal links and anchors resolve.');
