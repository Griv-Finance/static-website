/* Griv — product demonstrations. Every demo shows a workflow or a state change.
   Built on window.Griv helpers from site.js. All data is the illustrative Ade Fashion story. */
(() => {
  const { $, $$, reduce, whileVisible, once, naira } = window.Griv;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  /* ---------- Step demos: [data-tabs] sets data-step; [data-autoplay] advances while visible ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[role=tab]', root);
    let cur = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
    root.dataset.step = cur;
    root.addEventListener('tabchange', (e) => { cur = e.detail.index; root.dataset.step = cur; });
    const ms = +root.dataset.autoplay;
    if (!ms || reduce) return;
    let id = null, touched = false;
    const start = () => { if (!id && !touched) id = setInterval(() => root.selectTab((cur + 1) % tabs.length), ms); };
    const stop = () => { clearInterval(id); id = null; };
    whileVisible(root, start, stop, 0.3);
    const takeOver = () => { touched = true; stop(); };
    tabs.forEach((t) => { t.addEventListener('pointerdown', takeOver); t.addEventListener('keydown', takeOver); });
  });

  const demos = {};
  const run = () => $$('[data-demo]').forEach((el) => demos[el.dataset.demo] && demos[el.dataset.demo](el));


  /* ---------- Payment link: step state lives on data-step (CSS does the rest) ---------- */
  demos.paylink = () => {};

  /* ---------- Invoices: stamp the hero invoice once it's seen ---------- */
  const invStage = $('.inv-stage');
  if (invStage) once(invStage, () => setTimeout(() => invStage.classList.add('paid'), reduce ? 0 : 900), 0.5);

  /* ---------- Feed helper: prepend rows to a list while visible ---------- */
  const feed = (root, list, rows, render, ms, onAdd) => {
    let i = 0;
    const add = () => {
      const r = rows[i++ % rows.length];
      const li = document.createElement('li');
      li.className = 'new';
      li.innerHTML = render(r);
      list.prepend(li);
      while (list.children.length > 5) list.lastElementChild.remove();
      onAdd && onAdd(r);
    };
    // Seed so the list is never empty, even with reduced motion.
    rows.slice(0, 3).reverse().forEach((r) => { const li = document.createElement('li'); li.innerHTML = render(r); list.prepend(li); });
    i = 3;
    if (reduce) return;
    let id = null;
    whileVisible(root, () => { if (!id) id = setInterval(add, ms); }, () => { clearInterval(id); id = null; }, 0.3);
  };

  /* ---------- Virtual accounts: transfers arrive, balance counts up ---------- */
  demos.va = (root) => {
    const list = $('.vf-list', root), balEl = $('.va-bal', root);
    let bal = +balEl.dataset.start;
    const rows = [
      ['Chidi Prints', 'GRV-VA-88214', 185000], ['Kemi O.', 'GRV-VA-88215', 10000], ['Oba Foods', 'GRV-VA-88216', 250000],
      ['Ifeanyi N.', 'GRV-VA-88217', 65000], ['Lagos Gadget Hub', 'GRV-VA-88218', 120000], ['Bisi A.', 'GRV-VA-88219', 85000],
    ];
    const tween = (from, to) => {
      if (reduce) { balEl.textContent = naira(to); return; }
      const t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 800); balEl.textContent = naira(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    feed(root, list, rows,
      ([who, ref, amt]) => `<span class="fi in"><svg><use href="#i-in"/></svg></span><span><b>${who}</b><small>Transfer · <span class="mono">${ref}</span></small></span><em>+${naira(amt)}</em>`,
      3000, ([, , amt]) => { const from = bal; bal += amt; tween(from, bal); });
  };

  /* ---------- Cards: spend appears as it happens ---------- */
  demos.cards = (root) => {
    const rows = [
      ['o', 'Balogun Market Fabrics', 'Amaka M. · Supplier', 24500], ['d', 'Social media ads', 'Funke O. · Online', 40000],
      ['o', 'Fuel station, Lekki', 'Yusuf S. · Fuel', 18200], ['d', 'Design software', 'Funke O. · Online', 9500],
      ['o', 'Thread & Trims Ltd', 'Amaka M. · Supplier', 32000],
    ];
    feed(root, $('.cf-list', root), rows,
      ([c, m, who, amt]) => `<span class="cd-mini ${c}"></span><span><b>${m}</b><small>${who}</small></span><em>−${naira(amt)}</em>`, 2800);
  };

  /* ---------- Payouts: single payout form with review → confirm ---------- */
  demos.payout = (root) => {
    const form = $('.po-form', root), amt = $('#poAmt'), field = amt.closest('.field');
    const review = $('.po-review', form), done = $('.po-done', form);
    const BAL = 2450000;
    const parse = () => +amt.value.replace(/[^\d]/g, '');
    amt.addEventListener('input', () => {
      const v = parse();
      amt.value = v ? v.toLocaleString('en-NG') : '';
      field.classList.remove('bad'); amt.removeAttribute('aria-invalid');
    });
    const setMode = (m) => { form.classList.toggle('busy', m !== 'edit'); review.hidden = m !== 'review'; done.hidden = m !== 'done'; };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = parse();
      if (!v || v > BAL) { field.classList.add('bad'); amt.setAttribute('aria-invalid', 'true'); amt.focus(); return; }
      $('.po-r-amt', review).textContent = naira(v);
      setMode('review'); $('[data-po=confirm]', review).focus();
    });
    form.addEventListener('click', (e) => {
      const a = e.target.closest('[data-po]'); if (!a) return;
      if (a.dataset.po === 'back') { setMode('edit'); amt.focus(); }
      if (a.dataset.po === 'confirm') { setMode('done'); $('[data-po=reset]', done).focus(); }
      if (a.dataset.po === 'reset') { setMode('edit'); amt.value = '450,000'; amt.focus(); }
    });
    // The side copy follows the selected payout type.
    const copy = [
      ['Single', 'Pay one supplier in seconds.', 'Choose a saved beneficiary or add a new one, enter the amount and confirm. You always review before anything is sent.'],
      ['Bulk', 'Pay everyone at once.', 'Upload a spreadsheet or select beneficiaries in Griv, check the totals, then send all the payments with one confirmation.'],
      ['Scheduled', 'Set it once. Never pay late.', 'Choose a date — or repeat weekly or monthly — and Griv sends the payment on time from your balance.'],
    ];
    root.addEventListener('tabchange', (e) => {
      const [k, h, d] = copy[e.detail.index];
      $('.po-k1', root).textContent = k; $('.po-h', root).textContent = h; $('.po-d', root).textContent = d;
    });
  };


  /* ---------- POS: a working register — cart, charge, stock and sales update ---------- */
  demos.pos = (root) => {
    const lines = $('.pc-lines', root), totalEl = $('.pc-total', root), charge = $('.pc-charge', root);
    const ok = $('.pc-ok', root), sumEl = $('.ps-sum', root), countEl = $('.ps-count', root);
    const stock = {}; $$('.pa-p', root).forEach((b) => (stock[b.dataset.id] = parseInt($('.pa-stock', b).textContent, 10)));
    let cart = {}, method = 'Transfer', order = 1043, daySum = 170000, dayN = 2;
    const items = () => Object.values(cart).filter((c) => c.qty > 0);
    const total = () => items().reduce((s, c) => s + c.qty * c.price, 0);
    const render = () => {
      const list = items();
      lines.innerHTML = list.length ? list.map((c) => `<li><span>${c.name}</span><span class="pc-q"><button type="button" data-dec="${c.id}" aria-label="Remove one ${c.name}"><svg><use href="#i-minus"/></svg></button><span>${c.qty}</span><button type="button" data-inc="${c.id}" aria-label="Add one ${c.name}"><svg><use href="#i-plus"/></svg></button></span><b>${naira(c.qty * c.price)}</b></li>`).join('')
        : '<li class="pc-empty">Tap a product to add it</li>';
      totalEl.textContent = naira(total());
      charge.disabled = !list.length;
      charge.textContent = list.length ? `Charge ${naira(total())}` : 'Charge';
      $$('.pa-p', root).forEach((b) => { const left = stock[b.dataset.id] - ((cart[b.dataset.id] || {}).qty || 0); b.disabled = left <= 0; });
    };
    const add = (id, d = 1) => {
      const b = $(`.pa-p[data-id="${id}"]`, root);
      const c = cart[id] || (cart[id] = { id, name: b.dataset.name, price: +b.dataset.price, qty: 0 });
      c.qty = Math.max(0, Math.min(stock[id], c.qty + d));
      render();
    };
    $$('.pa-p', root).forEach((b) => b.addEventListener('click', () => { add(b.dataset.id); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }));
    lines.addEventListener('click', (e) => { const i = e.target.closest('[data-inc]'), d = e.target.closest('[data-dec]'); if (i) add(i.dataset.inc, 1); if (d) add(d.dataset.dec, -1); });
    $$('.pc-pay [role=radio]', root).forEach((r) => r.addEventListener('click', () => {
      method = r.dataset.m; $$('.pc-pay [role=radio]', root).forEach((x) => x.setAttribute('aria-checked', x === r));
    }));
    charge.addEventListener('click', () => {
      const list = items(); if (!list.length) return;
      const t = total();
      list.forEach((c) => {
        stock[c.id] -= c.qty;
        $(`.pa-p[data-id="${c.id}"] .pa-stock`, root).textContent = `${stock[c.id]} left`;
        const inv = $(`.ps-inv li[data-id="${c.id}"]`, root);
        if (inv) { $('b', inv).textContent = stock[c.id]; inv.classList.toggle('low', stock[c.id] <= 3); inv.classList.remove('flash'); void inv.offsetWidth; inv.classList.add('flash'); }
      });
      daySum += t; dayN += 1;
      sumEl.textContent = daySum.toLocaleString('en-NG'); countEl.textContent = dayN;
      $('.ps-st', root).className = 'tag ok ps-st'; $('.ps-st', root).textContent = 'Successful';
      $('.ps-tx', root).innerHTML = `<b>Order #${order}</b> · ${naira(t)} · ${method}`;
      $('.pc-ok-d', root).textContent = `Order #${order} · ${naira(t)} by ${method.toLowerCase()}`;
      ok.hidden = false; $('.pc-new', root).focus();
      order += 1; cart = {};
    });
    $('.pc-new', root).addEventListener('click', () => { ok.hidden = true; $('.pc-ord', root).textContent = `Order #${order}`; render(); $('.pa-p', root).focus(); });
    render();
  };

  /* ---------- Subscriptions: filter the timeline ---------- */
  const sbf = $$('.sbf');
  sbf.forEach((b) => b.addEventListener('click', () => {
    sbf.forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('.sb-days li').forEach((li) => li.classList.toggle('dim', b.dataset.f !== 'all' && li.dataset.k !== b.dataset.f));
  }));


  /* ---------- Inventory: select a product, record sales and restocks ---------- */
  demos.inventory = (root) => {
    const rows = $$('tbody tr', root), log = $('.il-list', root);
    const orders = { 'Online store': 1047, 'Lekki store': 1048 };
    let next = 1047;
    const status = (tr) => {
      const q = +$('.it-q', tr).textContent, low = +tr.dataset.low;
      $('.it-s', tr).innerHTML = q === 0 ? '<span class="tag err">Sold out</span>' : q <= low ? '<span class="tag warn">Low</span>' : '<span class="tag ok">In stock</span>';
    };
    const sel = () => rows.find((r) => $('input', r).checked);
    const mark = () => rows.forEach((r) => r.classList.toggle('sel', $('input', r).checked));
    const sync = () => { const r = sel(), q = +$('.it-q', r).textContent; $$('.it-sell', root).forEach((b) => (b.disabled = q === 0)); };
    rows.forEach((r) => { status(r); r.addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT') $('input', r).checked = true; mark(); sync(); }); });
    $$('input', root).forEach((i) => i.addEventListener('change', () => { mark(); sync(); }));
    const change = (d, ch, what) => {
      const r = sel(), qEl = $('.it-q', r), from = +qEl.textContent, to = Math.max(0, from + d);
      if (to === from) return;
      qEl.textContent = to; status(r);
      r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
      const name = $('.it-p', r).textContent.trim();
      const li = document.createElement('li');
      li.innerHTML = `<span class="il-ch"></span><span></span><b>${from} → ${to}</b>`;
      li.children[0].textContent = ch; li.children[1].textContent = `${name} ${what}`;
      log.prepend(li); while (log.children.length > 6) log.lastElementChild.remove();
      sync();
    };
    $$('.it-sell', root).forEach((b) => b.addEventListener('click', () => change(-1, b.dataset.ch, `sold · Order #${next++}`)));
    $('.it-restock', root).addEventListener('click', () => change(20, 'Restock', 'restocked from supplier'));
    mark(); sync();
  };

  /* ---------- Reconciliation: match records row by row ---------- */
  demos.recon = (root) => {
    const btn = $('.rc-run', root), rows = $$('tbody tr', root), note = $('.rc-note', root);
    const tags = { m: '<span class="tag ok">Matched</span>', u: '<span class="tag warn">Unmatched</span>', x: '<span class="tag err">Amount differs</span>' };
    const notes = { u: 'Bisi A. paid ₦10,000 but there’s no order for it yet.', x: 'Order #1046 is ₦65,000 but the settlement is ₦60,000 — worth checking.' };
    let running = false;
    const reset = () => rows.forEach((r) => { r.className = ''; $('.rc-st', r).innerHTML = '<span class="tag mute">Waiting</span>'; });
    const count = () => { ['m', 'u', 'x'].forEach((k) => ($(`.rc-${k}`, root).textContent = rows.filter((r) => r.classList.contains(k)).length)); };
    const run = async () => {
      if (running) return; running = true; reset(); count(); note.textContent = '';
      btn.classList.add('busy'); $('span', btn).textContent = 'Matching…';
      for (const r of rows) {
        r.classList.add('checking'); await wait(380);
        r.classList.remove('checking'); r.classList.add(r.dataset.r);
        $('.rc-st', r).innerHTML = tags[r.dataset.r]; count();
      }
      note.textContent = `${notes.u} ${notes.x}`;
      btn.classList.remove('busy'); $('span', btn).textContent = 'Match again'; running = false;
    };
    btn.addEventListener('click', run);
    once(root, run, 0.4);
  };

  /* ---------- Analytics: range filter drives KPIs, the line chart and the bars ---------- */
  demos.analytics = (root) => {
    const ranges = {
      7:  { sales: 1180000, orders: 23, ret: '58%', up: '+9%',  pts: 7 },
      30: { sales: 4820000, orders: 96, ret: '61%', up: '+18%', pts: 30 },
      90: { sales: 13650000, orders: 274, ret: '57%', up: '+22%', pts: 13, weekly: true },
    };
    const channels = [['Online store', .38], ['Lekki store (POS)', .31], ['Payment links', .19], ['Invoices', .12]];
    const products = [['Black Dress', .27], ['Adire Kaftan', .19], ['Leather Bag', .15], ['Beaded Sandals', .09]];
    // Deterministic, gently rising series so the chart is stable between visits.
    const series = (n, total, growth, seed) => {
      const raw = Array.from({ length: n }, (_, i) => (1 + growth * i / n) * (1 + .28 * Math.sin(i * 1.7 + seed) + .12 * Math.cos(i * 3.1 + seed * 2)));
      const k = total / raw.reduce((a, b) => a + b, 0);
      return raw.map((v) => Math.round(v * k / 500) * 500);
    };
    const plot = $('.ac-plot', root), svg = $('.ac-svg', root), tip = $('.ac-tip', root), hit = $('.ac-hit', root);
    const W = 800, H = 240;
    let cur = [], prev = [], labels = [], max = 1, focusI = -1;
    const fmtK = (v) => v >= 1e6 ? '₦' + (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'm' : '₦' + Math.round(v / 1000) + 'k';
    const xAt = (i) => (cur.length === 1 ? 0 : (i / (cur.length - 1)) * W);
    const yAt = (v) => H - (v / max) * H;
    const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ');
    const draw = (r) => {
      const d = ranges[r];
      cur = series(d.pts, d.sales, .5, 1); prev = series(d.pts, Math.round(d.sales / (1 + parseInt(d.up, 10) / 100)), .2, 2.4);
      labels = cur.map((_, i) => d.weekly ? `Week ${i + 1}` : `Day ${i + 1}`);
      const top = Math.max(...cur, ...prev); const step = Math.pow(10, Math.floor(Math.log10(top))) / 2; max = Math.ceil(top / step) * step;
      $('.ac-grid', svg).innerHTML = [0, .25, .5, .75, 1].map((f) => `<line x1="0" x2="${W}" y1="${(H - f * H).toFixed(1)}" y2="${(H - f * H).toFixed(1)}"/>`).join('');
      $('.ac-yl', root).innerHTML = [0, .5, 1].map((f) => `<span style="top:${(1 - f) * 100}%">${fmtK(f * max)}</span>`).join('');
      const every = Math.ceil(cur.length / 6);
      $('.ac-xl', root).innerHTML = labels.map((l, i) => (i % every === 0 || i === cur.length - 1) ? `<span style="left:${(xAt(i) / W) * 100}%">${l}</span>` : '').join('');
      $('.ac-cur', svg).setAttribute('d', path(cur)); $('.ac-prev', svg).setAttribute('d', path(prev));
      $('.ac-area', svg).setAttribute('d', `${path(cur)} L${W} ${H} L0 ${H} Z`);
      $('.ak-sales', root).textContent = naira(d.sales); $('.ak-orders', root).textContent = d.orders;
      $('.ak-aov', root).textContent = naira(Math.round(d.sales / d.orders / 100) * 100); $('.ak-ret', root).textContent = d.ret;
      $('.ak-d.up', root).textContent = `${d.up} vs previous period`;
      const bars = (k, list) => { $(`[data-k=${k}]`, root).innerHTML = list.map(([n, f]) => `<li><span>${n}</span><b>${naira(Math.round(d.sales * f / 1000) * 1000)}</b><i style="--w:${(f / list[0][1]) * 100}%"></i></li>`).join(''); };
      bars('channels', channels); bars('products', products);
      $('.ac-table tbody', root).innerHTML = cur.map((v, i) => `<tr><td>${labels[i]}</td><td class="num">${naira(v)}</td><td class="num">${naira(prev[i])}</td></tr>`).join('');
      hide(); focusI = -1;
    };
    const show = (i) => {
      focusI = i; plot.classList.add('hov');
      const x = xAt(i), y = yAt(cur[i]);
      $('.ac-x', svg).setAttribute('x1', x); $('.ac-x', svg).setAttribute('x2', x);
      $('.ac-dot', svg).setAttribute('cx', x); $('.ac-dot', svg).setAttribute('cy', y);
      tip.hidden = false;
      tip.innerHTML = '<span class="t"></span><b></b><span><i></i>This period</span><b></b><span><i class="prev"></i>Previous period</span>';
      const [t, b1, , b2] = tip.children; t.textContent = labels[i]; b1.textContent = naira(cur[i]); b2.textContent = naira(prev[i]);
      const px = (x / W) * plot.clientWidth;
      tip.style.left = Math.min(Math.max(px + 14, 0), plot.clientWidth - 190) + 'px';
      if (px + 14 > plot.clientWidth - 190) tip.style.left = Math.max(0, px - 190) + 'px';
    };
    function hide() { plot.classList.remove('hov'); tip.hidden = true; }
    hit.addEventListener('pointermove', (e) => { const r = hit.getBoundingClientRect(); show(Math.round(((e.clientX - r.left) / r.width) * (cur.length - 1))); });
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('focus', () => show(focusI < 0 ? cur.length - 1 : focusI));
    hit.addEventListener('blur', hide);
    hit.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
      e.preventDefault(); show(Math.max(0, Math.min(cur.length - 1, (focusI < 0 ? cur.length - 1 : focusI) + d)));
    });
    $$('.an-range button', root).forEach((b) => b.addEventListener('click', () => {
      $$('.an-range button', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(+b.dataset.r);
    }));
    draw(30);
  };

  /* ---------- Griv AI: question → answer → suggested action → confirm ---------- */
  demos.ai = (root) => {
    const thread = $('.aa-thread', root), qs = $$('.aa-q', root);
    const answers = [
      { a: 'Sales increased <b>18%</b> this month, driven primarily by your <b>Lagos store</b>. Your top-selling product is running low, and your supplier payment of <b>₦450,000</b> is scheduled for Friday.',
        recs: [{ t: 'Restock Black Dress', d: [['Supplier', 'ABC Textiles'], ['Quantity', '40 units']], done: 'Restock order for 40 Black Dresses created.' }] },
      { a: '<b>Beaded Sandals</b> have 3 left and <b>Silk Scarf</b> is sold out. At this month’s pace, <b>Black Dress</b> (22 left) will run out in about 3 weeks.',
        recs: [{ t: 'Restock Beaded Sandals', d: [['Quantity', '40 units']], done: 'Restock order for 40 Beaded Sandals created.' }, { t: 'Restock Silk Scarf', d: [['Quantity', '25 units']], done: 'Restock order for 25 Silk Scarves created.' }] },
      { a: '<b>Lagos Gadget Hub</b> hasn’t paid Invoice #2039 (₦180,000) — it’s 6 days overdue. <b>Oba Foods</b> viewed Invoice #2042 (₦1,250,000) yesterday; it’s due on 14 November.',
        recs: [{ t: 'Send a reminder to Lagos Gadget Hub', d: [['Invoice', '#2039 · ₦180,000'], ['Send to', 'accounts email']], done: 'Reminder for Invoice #2039 sent to Lagos Gadget Hub.' }] },
      { a: 'Two payments are due this week: <b>ABC Textiles</b> (₦450,000, Friday) and <b>rent for the Lekki store</b> (₦300,000, 1 November). Your balance of <b>₦2,450,000</b> covers both.',
        recs: [{ t: 'Review Friday’s payout to ABC Textiles', d: [['Amount', '₦450,000'], ['Date', 'Friday, 9:00']], done: 'Payout to ABC Textiles confirmed for Friday.' }] },
    ];
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    let token = 0;
    const ask = async (i) => {
      const my = ++token;
      qs.forEach((q, k) => q.setAttribute('aria-pressed', k === i));
      thread.innerHTML = '';
      thread.append(el('p', 'b out', qs[i].textContent));
      const think = el('p', 'aa-think', '<svg><use href="#i-spark"/></svg>Looking across sales, payments, inventory and invoices…');
      thread.append(think);
      await wait(1100); if (my !== token) return;
      think.remove();
      const ans = el('div', 'aa-ans'); ans.append(el('p', null, answers[i].a));
      const recs = el('div', 'aa-recs');
      answers[i].recs.forEach((r) => {
        const box = el('div', 'aa-rec');
        // States: suggested → review (draft shown) → done. Only "done" means something happened.
        const render = (state) => {
          box.innerHTML = '';
          if (state === 'suggested') {
            box.append(el('span', 'tag warn', 'Suggested'), el('p', null, r.t));
            const b = el('button', 'act', 'Review'); b.type = 'button'; box.append(b);
            b.addEventListener('click', () => { render('review'); $('.cb .btn', box).focus(); });
          } else if (state === 'review') {
            box.append(el('span', 'tag mute', 'Ready to confirm'), el('p', null, r.t));
            const c = el('div', 'aa-confirm', `<dl>${r.d.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="cb"><button type="button" class="btn" style="height:38px">Confirm</button><button type="button" class="btn btn-line" style="height:38px">Not now</button></div>`);
            box.append(c);
            const [ok, no] = $$('.cb button', c);
            ok.addEventListener('click', () => render('done'));
            no.addEventListener('click', () => { render('suggested'); $('.act', box).focus(); });
          } else {
            box.append(el('span', 'tag ok', 'Done by you'), el('p', null, `${r.done} (Demo — nothing was actually sent.)`));
          }
        };
        render('suggested');
        recs.append(box);
      });
      ans.append(el('p', 'aa-k', 'Suggested next steps')); ans.append(recs);
      thread.append(ans);
    };
    qs.forEach((q, i) => q.addEventListener('click', () => ask(i)));
    once(root, () => ask(0), 0.3);
  };

  // Demo registrations are added below, one block per product page.
  window.GrivDemos = demos;
  queueMicrotask(run);
})();
