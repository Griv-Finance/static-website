/* Griv homepage interactions. Navigation, reveals and the CTA background live in site.js. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const naira = (v) => '₦' + Math.round(v).toLocaleString('en-NG');

  // Run `fn` while `el` is on screen; stop when it leaves. Returns nothing.
  const whileVisible = (el, start, stop, threshold = 0.25) => {
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop && stop()), { threshold }).observe(el);
  };
  const once = (el, fn, threshold = 0.35) => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { threshold });
    io.observe(el);
  };
  const loop = (fn, ms) => { let id = null; return { start() { if (!id && !reduce) { fn(); id = setInterval(fn, ms); } }, stop() { clearInterval(id); id = null; } }; };

  /* ---------- Hero console: Collect / Sell / Pay ---------- */
  const views = [
    { label: 'Today’s collections', bal: 2450000, delta: '+₦270,000 today', rows: [
      ['in', 'Tolu A.', 'Payment link', '+₦85,000', 'pos'],
      ['in', 'Chidi Prints', 'Virtual account · Bank transfer', '+₦185,000', 'pos'],
      ['#', 'Invoice #2041', 'Sent to Chidi Prints', 'Awaiting', 'st wait'] ] },
    { label: 'Today’s sales', bal: 2535000, delta: '+₦85,000 from orders', rows: [
      ['#', 'Order #1042', 'Online store · Black Dress', 'Paid', 'st'],
      ['dress', 'Black Dress', 'Inventory updated', '24 → 23', ''],
      ['#', 'Order #1043', 'POS · Lekki store', 'Paid', 'st'] ] },
    { label: 'Upcoming payments', bal: 2085000, delta: '−₦450,000 scheduled Friday', rows: [
      ['out', 'ABC Textiles', 'Supplier · Friday', '₦450,000', ''],
      ['out', 'Staff payroll', 'Bulk payout · 8 people', '₦1,250,000', ''],
      ['out', 'Rent · Lekki store', 'Recurring · Monthly', '₦300,000', ''] ] },
  ];
  const icon = (k) => k === 'in' ? '<span class="fi in"><svg><use href="#i-in"/></svg></span>'
    : k === 'out' ? '<span class="fi"><svg><use href="#i-out"/></svg></span>'
    : k === 'dress' ? '<span class="fi dress"><svg><use href="#i-dress"/></svg></span>'
    : '<span class="fi"><b>#</b></span>';
  const segs = $$('.seg [role=tab]'), rowsEl = $('#conRows'), balEl = $('#conBal');
  let cur = 0, balNow = views[0].bal, auto = null;
  const tweenBal = (to) => {
    if (reduce) { balEl.textContent = naira(to); balNow = to; return; }
    const from = balNow, t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3); balEl.textContent = naira(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); else balNow = to; };
    requestAnimationFrame(step);
  };
  const show = (i) => {
    cur = i; const v = views[i];
    segs.forEach((s, k) => { s.setAttribute('aria-selected', k === i); s.tabIndex = k === i ? 0 : -1; });
    $('#conBody').setAttribute('aria-labelledby', segs[i].id);
    $('#conLabel').textContent = v.label;
    $('#conDelta').textContent = v.delta;
    rowsEl.innerHTML = v.rows.map(([k, a, b, c, cls]) => `<li>${icon(k)}<span><b>${a}</b><small>${b}</small></span><em class="${cls}">${c}</em></li>`).join('');
    tweenBal(v.bal);
  };
  segs.forEach((s, i) => {
    s.addEventListener('click', () => { stopAuto(); show(i); });
    s.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); stopAuto(); const n = (i + d + segs.length) % segs.length; segs[n].focus(); show(n); }
    });
  });
  const stopAuto = () => { clearInterval(auto); auto = null; };
  show(0);
  if (!reduce) {
    const console_ = $('#console');
    whileVisible(console_, () => { if (!auto && !console_.dataset.touched) auto = setInterval(() => show((cur + 1) % views.length), 4200); }, stopAuto, 0.4);
    console_.addEventListener('pointerdown', () => { console_.dataset.touched = '1'; stopAuto(); });
  }

  /* ---------- Ticker: duplicate for a seamless loop ---------- */
  const tl = $('.tick-list');
  const clone = tl.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); tl.after(clone);

  /* ---------- Why: payment rows roll in ---------- */
  const payRows = $('.pay-rows');
  let pr = 0;
  const rollPay = loop(() => {
    pr = (pr + 1) % 4;
    $$('li', payRows).forEach((li) => (li.style.transform = `translateY(${-pr * (li.offsetHeight + 8)}px)`));
  }, 2400);
  whileVisible(payRows, rollPay.start, rollPay.stop);

  /* ---------- Why: nine tools collapse into Griv ---------- */
  const stack = $('#stackArt');
  if (reduce) stack.classList.add('merged');
  else {
    let t1, t2;
    const cycle = () => { stack.classList.remove('merged'); t1 = setTimeout(() => stack.classList.add('merged'), 1600); };
    const merge = loop(cycle, 6200);
    whileVisible(stack, merge.start, () => { merge.stop(); clearTimeout(t1); clearTimeout(t2); }, 0.5);
  }

  /* ---------- Why: payment → order → inventory → reconciled ---------- */
  const fcards = $$('.fcard');
  let fi = 0;
  const layout = () => fcards.forEach((c, k) => {
    const d = (k - fi + fcards.length) % fcards.length; // 0 = front
    c.style.zIndex = 10 - d;
    c.style.opacity = d > 2 ? 0 : 1 - d * 0.25;
    c.style.transform = d === fcards.length - 1 ? 'translateY(-40px) scale(.96)' : `translateY(${d * 14}px) scale(${1 - d * 0.05})`;
  });
  layout();
  const flow = loop(() => { fi = (fi + 1) % fcards.length; layout(); }, 1900);
  whileVisible($('#flowArt'), flow.start, flow.stop);

  /* ---------- Demo player ---------- */
  const video = $('#video'), play = $('#vPlay'), vsteps = $$('.v-steps li'), bar = $('.v-bar i');
  let vi = -1, vt = null;
  const vStep = () => {
    vi = (vi + 1) % vsteps.length;
    vsteps.forEach((s, k) => { s.classList.toggle('on', k === vi); s.classList.toggle('past', k < vi); });
    bar.style.transition = 'none'; bar.style.width = (vi / vsteps.length) * 100 + '%';
    requestAnimationFrame(() => { bar.style.transition = 'width 2.2s linear'; bar.style.width = ((vi + 1) / vsteps.length) * 100 + '%'; });
  };
  const vPlay = (on) => {
    video.classList.toggle('playing', on);
    play.setAttribute('aria-pressed', on);
    play.setAttribute('aria-label', on ? 'Pause the Griv business day demo' : 'Play the Griv business day demo');
    clearInterval(vt);
    if (on) { vStep(); vt = setInterval(vStep, 2300); }
  };
  play.addEventListener('click', () => vPlay(!video.classList.contains('playing')));
  // Hero links to #demo: start playing when someone arrives via them.
  $$('a[href="#demo"]').forEach((a) => a.addEventListener('click', () => setTimeout(() => vPlay(true), 600)));
  whileVisible(video, () => {}, () => video.classList.contains('playing') && vPlay(false), 0.1);

  /* ---------- AI cards ---------- */
  $$('.ai-card').forEach((card) => once(card, () => {
    card.classList.add('in');
    if (card.dataset.step === '1') {
      $$('.checks li', card).forEach((li, k) => setTimeout(() => li.classList.add('ok'), reduce ? 0 : 500 + k * 380));
      setTimeout(() => { $('.thinking', card).lastChild.textContent = 'Analysis complete'; }, reduce ? 0 : 500 + 6 * 380);
    }
  }, 0.45));
  const done = $('.answer .done');
  const msgs = { 'Restock product': 'Restock order drafted for Black Dress · 40 units.', 'Schedule payment': 'Payment to ABC Textiles confirmed for Friday.', 'View sales': 'Opening this month’s sales report…' };
  $$('.answer .act').forEach((b) => b.addEventListener('click', () => { done.textContent = '✓ ' + msgs[b.textContent.trim()]; }));

  /* ---------- Reconciliation donut ---------- */
  const dn = $('.donut .dn');
  if (!reduce) { dn.style.strokeDashoffset = 88; once(dn.closest('.tile'), () => requestAnimationFrame(() => (dn.style.strokeDashoffset = 0))); }

  /* ---------- Grows with you ---------- */
  const grow = $$('#grow li');
  once($('#grow'), () => grow.forEach((li, k) => setTimeout(() => li.classList.add('on'), reduce ? 0 : 250 + k * 320)), 0.6);
})();
