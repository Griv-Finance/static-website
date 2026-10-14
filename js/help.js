/* Help Centre: filter articles as you type; open matches. */
(() => {
  const input = document.getElementById('hpq');
  if (!input) return;
  const groups = [...document.querySelectorAll('.hp-g')];
  const items = [...document.querySelectorAll('.hp-g details')];
  const empty = document.querySelector('.hp-empty'), count = document.querySelector('.hp-n');
  const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ');
  const index = items.map((d) => norm(d.textContent));

  const run = () => {
    const words = norm(input.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((d, i) => {
      const hit = !words.length || words.every((w) => index[i].includes(w));
      d.hidden = !hit; if (hit) shown++;
      d.open = !!words.length && hit && shown <= 3;
    });
    groups.forEach((g) => (g.hidden = ![...g.querySelectorAll('details')].some((d) => !d.hidden)));
    empty.hidden = shown > 0;
    count.textContent = words.length ? `${shown} ${shown === 1 ? 'answer' : 'answers'}` : '';
  };
  input.addEventListener('input', run);
  document.querySelectorAll('.hp-pop [data-q]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.q; run(); input.focus(); }));
})();
