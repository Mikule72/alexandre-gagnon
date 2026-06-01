/* =========================================================
   Alexandre Gagnon — Atelier événementiel
   script.js : interactions vanilla
   - sticky header + dark mode sur hero
   - scroll progress bar
   - menu mobile animé
   - cursor glow (décoratif)
   - reveal au scroll (IntersectionObserver)
   - soumission formulaire vers Supabase (mode placeholder)
   ========================================================= */

/* -------------------------------------------------
   Configuration Supabase
   À renseigner après création du projet (voir README)
   ------------------------------------------------- */
const SUPABASE_URL = 'TODO_REMPLIR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TODO_REMPLIR_SUPABASE_ANON_KEY';
const SUPABASE_TABLE = 'leads';

/* ============== Footer year ============== */
document.getElementById('year').textContent = new Date().getFullYear();

/* ============== Sticky header + dark mode ============== */
const header = document.querySelector('.site-header');
const hero   = document.querySelector('.hero');

const onScroll = () => {
  const scrolled = window.scrollY > 8;
  header.classList.toggle('scrolled', scrolled);

  if (hero) {
    const heroBottom = hero.getBoundingClientRect().bottom;
    if (heroBottom > 80) header.setAttribute('data-dark', '');
    else                 header.removeAttribute('data-dark');
  }

  // Scroll progress
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (window.scrollY / docHeight * 100).toFixed(2) : 0;
  header.style.setProperty('--scroll-pct', pct + '%');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============== Menu mobile (animé) ============== */
const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

function openMobileNav() {
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Fermer le menu');
  mobileNav.removeAttribute('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => mobileNav.classList.add('is-open'));
  });
}

function closeMobileNav() {
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Ouvrir le menu');
  mobileNav.classList.remove('is-open');
  mobileNav.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'max-height' && !mobileNav.classList.contains('is-open')) {
      mobileNav.setAttribute('hidden', '');
    }
  }, { once: true });
}

navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  open ? closeMobileNav() : openMobileNav();
});

mobileNav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') closeMobileNav();
});

/* ============== Cursor glow (décoratif) ============== */
const cursorGlow = document.createElement('div');
cursorGlow.classList.add('cursor-glow');
cursorGlow.setAttribute('aria-hidden', 'true');
document.body.appendChild(cursorGlow);

let cursorRaf;
document.addEventListener('mousemove', (e) => {
  cancelAnimationFrame(cursorRaf);
  cursorRaf = requestAnimationFrame(() => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top  = e.clientY + 'px';
    cursorGlow.classList.add('visible');
  });
});
document.addEventListener('mouseleave', () => cursorGlow.classList.remove('visible'));

/* ============== Reveal au scroll ============== */
const revealTargets = [
  '.hero-content',
  '.hero-figure',
  '.stats li',
  '.pres-grid > *',
  '.section-head',
  '.step',
  '.presta-card',
  '.map-figure',
  '.terr-legend',
  '.contact-intro > *',
  '.lead-form',
];

revealTargets.forEach((selector) => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('delay-1');
    if (i % 3 === 2) el.classList.add('delay-2');
  });
});

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ============== Formulaire — Supabase ============== */
const form       = document.getElementById('leadForm');
const feedback   = form.querySelector('.form-feedback');
const submitBtn  = form.querySelector('button[type="submit"]');
const btnLabel   = submitBtn.querySelector('.btn-label');
const defaultLabel = submitBtn.dataset.defaultLabel;

const setFeedback = (state, message) => {
  feedback.dataset.state = state;
  feedback.textContent = message;
};

const setLoading = (loading) => {
  submitBtn.dataset.state = loading ? 'loading' : '';
  btnLabel.textContent = loading ? 'Envoi en cours' : defaultLabel;
};

const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.startsWith('TODO_');

let _supabaseClient = null;
const getSupabase = () => {
  if (_supabaseClient) return _supabaseClient;
  if (!isSupabaseConfigured()) return null;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
  _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabaseClient;
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const payload = {
    nom:           formData.get('nom').trim(),
    entreprise:    formData.get('entreprise').trim(),
    email:         formData.get('email').trim(),
    telephone:     (formData.get('telephone') || '').trim() || null,
    type_evenement: formData.get('type_evenement'),
    participants:  Number(formData.get('participants')),
    date_envisagee: formData.get('date_envisagee') || null,
    lieu:          (formData.get('lieu') || '').trim() || null,
    message:       formData.get('message').trim(),
  };

  const client = getSupabase();

  if (!client) {
    setFeedback(
      'info',
      'Configuration Supabase manquante. Renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans script.js (voir README.md). En attendant, votre demande n\'a pas été envoyée.'
    );
    console.info('[lead-form] payload prêt, en attente de configuration Supabase :', payload);
    return;
  }

  setLoading(true);
  setFeedback('', '');

  try {
    const { error } = await client.from(SUPABASE_TABLE).insert(payload);
    if (error) throw error;
    form.reset();
    setFeedback(
      'success',
      'Merci ! Votre demande a bien été envoyée. Je reviens vers vous sous 24h ouvrées.'
    );
  } catch (err) {
    console.error('[lead-form] erreur Supabase :', err);
    setFeedback(
      'error',
      'Une erreur est survenue lors de l\'envoi. Vous pouvez réessayer ou m\'écrire directement à alexandre.ggn@gmail.com.'
    );
  } finally {
    setLoading(false);
  }
});
