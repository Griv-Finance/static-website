/* Contact form: validation and honest submission.
   The form only reports success when the configured endpoint accepts the message.
   With no endpoint configured, it says plainly that nothing was sent. */
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const $ = (s, r = document) => r.querySelector(s);
  const endpoint = (form.dataset.endpoint || '').trim();
  const card = form.closest('.ct-card'), result = $('.ct-result', card), status = $('.ct-status', form);
  const submit = $('.ct-submit', form);

  // Pre-select a topic from ?topic=… (used by links across the site).
  const topic = new URLSearchParams(location.search).get('topic');
  if (topic && form.topic.querySelector(`option[value="${CSS.escape(topic)}"]`)) form.topic.value = topic;

  const rules = {
    topic: (v) => !!v,
    name: (v) => v.trim().length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    phone: (v) => !v.trim() || /^\+?[\d\s()-]{7,20}$/.test(v.trim()),
    message: (v) => v.trim().length >= 20,
    consent: (_, el) => el.checked,
  };
  const check = (name) => {
    const el = form.elements[name];
    const ok = rules[name](el.value, el);
    const field = el.closest('.field');
    if (field) field.classList.toggle('bad', !ok);
    else $('.ct-ce', form).style.display = ok ? 'none' : 'flex';
    el.setAttribute('aria-invalid', String(!ok));
    return ok;
  };
  Object.keys(rules).forEach((n) => {
    const el = form.elements[n];
    el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') check(n); });
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => { if (el.getAttribute('aria-invalid') === 'true') check(n); });
  });
  const counter = $('.ct-count', form);
  form.message.addEventListener('input', () => (counter.textContent = `${form.message.value.length} / 2000`));

  const show = (kind, title, text) => {
    form.hidden = true; result.hidden = false;
    result.dataset.kind = kind;
    $('.ct-r-h', result).textContent = title;
    $('.ct-r-p', result).textContent = text;
    result.focus();
  };
  $('.ct-again', result).addEventListener('click', () => { result.hidden = true; form.hidden = false; submit.focus(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const bad = Object.keys(rules).filter((n) => !check(n));
    if (bad.length) {
      form.elements[bad[0]].focus();
      status.textContent = `Please fix ${bad.length === 1 ? 'the highlighted field' : `${bad.length} highlighted fields`}.`;
      return;
    }
    if (!endpoint) {
      show('notsent', 'Your message hasn’t been sent',
        'Online messages aren’t connected yet, so nothing was sent and nothing was stored. Your details are still in the form if you go back.');
      return;
    }
    submit.disabled = true; $('span', submit).textContent = 'Sending…';
    try {
      const data = Object.fromEntries(new FormData(form));
      data.consent = true;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(String(res.status));
      form.reset(); counter.textContent = '0 / 2000';
      show('sent', 'Thanks — we’ve got your message', 'We’ll reply to the email address you gave us.');
    } catch {
      status.textContent = 'We couldn’t send your message. Please check your connection and try again — nothing was sent.';
    } finally {
      submit.disabled = false; $('span', submit).textContent = 'Send message';
    }
  });
})();
