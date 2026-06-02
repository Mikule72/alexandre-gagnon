/* =========================================================
   Alexandre Gagnon — Atelier événementiel
   script.js — interactions vanilla
   ========================================================= */

const SUPABASE_URL      = 'TODO_REMPLIR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TODO_REMPLIR_SUPABASE_ANON_KEY';
const SUPABASE_TABLE    = 'leads';

/* ── Year ── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Header scroll progress ── */
const header = document.querySelector('.header');
const onScroll = () => {
  const docH = document.body.scrollHeight - window.innerHeight;
  const pct  = docH > 0 ? (window.scrollY / docH * 100).toFixed(2) : 0;
  header?.style.setProperty('--scroll-pct', pct + '%');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Mobile nav ── */
const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (navToggle && mobileNav) {
  function openNav() {
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Fermer le menu');
    mobileNav.removeAttribute('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => mobileNav.classList.add('is-open')));
  }
  function closeNav() {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Ouvrir le menu');
    mobileNav.classList.remove('is-open');
    mobileNav.addEventListener('transitionend', e => {
      if (e.propertyName === 'max-height' && !mobileNav.classList.contains('is-open')) {
        mobileNav.setAttribute('hidden', '');
      }
    }, { once: true });
  }
  navToggle.addEventListener('click', () =>
    navToggle.getAttribute('aria-expanded') === 'true' ? closeNav() : openNav()
  );
  mobileNav.addEventListener('click', e => { if (e.target.tagName === 'A') closeNav(); });
}

/* ── Reveal on scroll ── */
const revealSelectors = [
  '.hero-left', '.hero-right',
  '.stat-item',
  '.pres-photo-col', '.pres-text',
  '.step-card',
  '.presta-card',
  '.contact-left', '.contact-form',
  '.footer-top > *',
];

revealSelectors.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('delay-1');
    if (i % 3 === 2) el.classList.add('delay-2');
  });
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ── Form ── */
const form       = document.getElementById('leadForm');
const feedback   = form?.querySelector('.form-feedback');
const submitBtn  = form?.querySelector('button[type="submit"]');
const btnLabel   = submitBtn?.querySelector('.btn-label');
const defaultLabel = submitBtn?.dataset.defaultLabel || 'Envoyer la demande →';

const setFeedback = (state, msg) => {
  if (!feedback) return;
  feedback.dataset.state = state;
  feedback.textContent = msg;
};
const setLoading = loading => {
  if (!submitBtn || !btnLabel) return;
  submitBtn.disabled = loading;
  btnLabel.textContent = loading ? 'Envoi en cours…' : defaultLabel;
};

const isConfigured = () =>
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('TODO');

let supabase = null;
const getClient = () => {
  if (supabase) return supabase;
  if (!isConfigured() || !window.supabase?.createClient) return null;
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
};

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const payload = {
      nom:            fd.get('nom')?.trim(),
      entreprise:     fd.get('entreprise')?.trim(),
      email:          fd.get('email')?.trim(),
      telephone:      fd.get('telephone')?.trim() || null,
      type_evenement: fd.get('type_evenement') || null,
      participants:   Number(fd.get('participants')) || null,
      message:        fd.get('message')?.trim(),
    };

    const client = getClient();
    if (!client) {
      setFeedback('info', 'Supabase non configuré — votre message n\'a pas été envoyé. Contactez-moi directement par e-mail.');
      console.info('[form] payload:', payload);
      return;
    }

    setLoading(true);
    try {
      const { error } = await client.from(SUPABASE_TABLE).insert(payload);
      if (error) throw error;
      form.reset();
      setFeedback('success', 'Merci ! Je reviens vers vous sous 24h ouvrées.');
    } catch (err) {
      console.error('[form]', err);
      setFeedback('error', 'Erreur lors de l\'envoi. Écrivez-moi directement : alexandre.ggn@gmail.com');
    } finally {
      setLoading(false);
    }
  });
}
