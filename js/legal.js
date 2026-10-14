/* Legal pages: highlight the section currently in view in the table of contents. */
(() => {
  const links = [...document.querySelectorAll('.toc a')];
  if (!links.length) return;
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => { a.classList.remove('on'); a.removeAttribute('aria-current'); });
      const a = byId.get(e.target.id);
      if (a) { a.classList.add('on'); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-130px 0px -65% 0px' });
  byId.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
})();
