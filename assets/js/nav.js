// Landing page navigation: mobile overlay menu and light/dark toggle.
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('navOverlay');
  const trigger = document.querySelector('.nav-overlay-trigger');
  const closeButton = overlay?.querySelector('.nav-overlay-close');

  const openOverlay = () => {
    overlay.classList.add('active');
    overlay.removeAttribute('inert');
    document.body.classList.add('nav-overlay-open');
    trigger.setAttribute('aria-expanded', 'true');
    closeButton?.focus();
  };

  const closeOverlay = () => {
    if (!overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    overlay.setAttribute('inert', '');
    document.body.classList.remove('nav-overlay-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  };

  if (overlay && trigger) {
    overlay.setAttribute('inert', '');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'navOverlay');
    trigger.addEventListener('click', openOverlay);
    closeButton?.addEventListener('click', closeOverlay);
    overlay.querySelectorAll('.nav-overlay-link').forEach(link => link.addEventListener('click', closeOverlay));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay();
    });
  }

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    window.setSiteTheme(next);
  });
});
