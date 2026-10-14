# Griv website

Static multi-page site. No framework and no dependencies: just Node to build.

## Build

```sh
node tools/build.mjs        # writes every page, then checks all internal links and anchors
python3 -m http.server 8765 # preview at http://localhost:8765
```

Edit the files in `src/`, then rebuild. **Don't edit the generated `index.html` files in the root, `products/`, `about/` and so on.** They're overwritten on every build.

## Structure

```
src/
  site.config.json   ← links and data that still need real values (see below)
  partials/          ← layout, header + mega-menu, footer, icon sprite, closing CTA
  pages/             ← one file per page; path = URL (pages/products/pos.html → /products/pos/)
css/styles.css       ← homepage styles and design tokens (shared)
css/pages.css        ← navigation, shared page blocks, per-page compositions
js/site.js           ← every page: nav, mega-menus, reveals, tabs, copy buttons
js/main.js           ← homepage interactions
js/demos.js          ← product demos (POS register, reconciliation, analytics chart, Griv AI, …)
js/forms.js          ← contact form validation and submission
js/help.js, legal.js ← Help Centre search; legal table of contents
```

Each page starts with a header comment:

```html
<!--page {"title": "…", "description": "…", "nav": "dark" | "light", "scripts": ["/js/demos.js"]} -->
```

`nav: "dark"` pages open on a dark hero, and the nav starts transparent over it. Include the shared closing CTA with
`<!--@include cta title="…" sub="…" button="…" href="{{signup}}"-->`.

## Needs real values: `src/site.config.json`

| Key | Currently | What to set |
|---|---|---|
| `signup` | `/contact/?topic=start` | Sign-up URL |
| `login` | `#` | Login URL |
| `docs.*` | `#` | Mintlify URLs for docs, API reference, SDKs, guides |
| `contact.endpoint` | empty | A URL that accepts a JSON POST. While empty, the form validates but tells the visitor nothing was sent. |
| `careers.roles` | `[]` | Open roles. Empty shows an honest "no open roles" state. |
| `pricing.groups[].items[].price` | empty | Confirmed prices. Empty shows "Published at launch". |
| `security.certifications` | `[]` | Only certifications Griv actually holds |

## Before launch

- **Legal:** Privacy and Terms are marked as drafts. The bracketed items, and the partner placeholders in the footer disclaimer, need legal and compliance sign-off.
- **404:** the build writes `404.html`. Most static hosts serve it automatically.
