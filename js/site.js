/* Griv — shared behaviour for every page: navigation, mega-menus, reveals, tabs, CTA motion.
   Page-specific scripts (main.js, demos.js) use the helpers exposed on window.Griv. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const whileVisible = (el, start, stop, threshold = 0.25) => {
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop && stop()), { threshold }).observe(el);
  };
  const once = (el, fn, threshold = 0.35) => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { threshold });
    io.observe(el);
  };
  const loop = (fn, ms) => { let id = null; return { start() { if (!id && !reduce) { fn(); id = setInterval(fn, ms); } }, stop() { clearInterval(id); id = null; } }; };
  const naira = (v) => '₦' + Math.round(v).toLocaleString('en-NG');
  window.Griv = { $, $$, reduce, whileVisible, once, loop, naira };

  /* ---------- Nav: transparent over a dark hero, solid everywhere else ---------- */
  const nav = $('#nav');
  const darkHero = document.body.dataset.nav === 'dark' ? $('.hero-panel') : null;
  const onScroll = () => {
    if (!darkHero) { nav.classList.add('solid'); return; }
    const solid = scrollY > darkHero.offsetHeight - 120;
    nav.classList.toggle('solid', solid);
    nav.classList.toggle('over', !solid && scrollY > 40);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $('#navToggle'), links = $('#navLinks');
  const mobile = matchMedia('(max-width: 1000px)');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('open', open);
    nav.classList.toggle('menu', open);
    if (!open) closeMegas();
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- Mega-menus ---------- */
  const triggers = $$('.nav-trigger');
  let hoverTimer;
  const openMega = (btn) => {
    triggers.forEach((t) => { if (t !== btn) t.setAttribute('aria-expanded', 'false'); });
    btn.setAttribute('aria-expanded', 'true');
    nav.classList.add('mega-open');
  };
  function closeMegas() {
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    nav.classList.remove('mega-open');
  }
  triggers.forEach((btn) => {
    const item = btn.parentElement;
    btn.addEventListener('click', () => (btn.getAttribute('aria-expanded') === 'true' ? closeMegas() : openMega(btn)));
    item.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' || mobile.matches) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openMega(btn), 60); });
    item.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse' || mobile.matches) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(closeMegas, 180); });
    // Leaving the last link with Tab closes the panel.
    item.addEventListener('focusout', (e) => { if (!mobile.matches && !item.contains(e.relatedTarget)) btn.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-item')) closeMegas(); });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = triggers.find((t) => t.getAttribute('aria-expanded') === 'true');
    if (open) { closeMegas(); open.focus(); return; }
    if (links.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Reveals ---------- */
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => rio.observe(el));

  /* ---------- CTA panel background runs only while on screen ---------- */
  $$('.cta-panel').forEach((p) => { if (!reduce) whileVisible(p, () => p.classList.add('live'), () => p.classList.remove('live'), 0.05); });

  /* ---------- Tabs: [data-tabs] > [role=tablist] > [role=tab][aria-controls] ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[role=tab]', root);
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tabs[i].focus();
      root.dispatchEvent(new CustomEvent('tabchange', { detail: { index: i } }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    root.selectTab = select;
  });

  /* ---------- Copy buttons: [data-copy="text"] ---------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const label = b.querySelector('.copy-l') || b;
    const was = label.textContent;
    try { await navigator.clipboard.writeText(b.dataset.copy); label.textContent = 'Copied'; }
    catch { label.textContent = 'Copy failed'; }
    setTimeout(() => (label.textContent = was), 1600);
  }));
})();
