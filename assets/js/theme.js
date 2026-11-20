// Applies the saved (or system) colour scheme before first paint. Load it in <head>.
(function () {
  var theme;
  try {
    theme = localStorage.getItem('theme');
  } catch (e) {
    // Storage unavailable (private mode, blocked cookies): fall back to the system setting.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);

  // Switches theme instantly: the stylesheets animate colours on many elements with
  // different durations, which makes a theme change look like a slow, uneven fade.
  window.setSiteTheme = function (next) {
    var root = document.documentElement;
    root.setAttribute('data-theme', next);
    getComputedStyle(document.body).color; // flush styles so the transitions exist
    if (document.getAnimations) {
      document.getAnimations().forEach(function (animation) {
        if (typeof CSSTransition !== 'undefined' && animation instanceof CSSTransition) {
          animation.finish();
        }
      });
    }
    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      // Storage unavailable: the choice just won't persist.
    }
  };
})();
