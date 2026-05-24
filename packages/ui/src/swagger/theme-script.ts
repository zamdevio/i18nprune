/** Same key as apps/web — keeps runtime theme choice aligned when origins match. */
export const SWAGGER_THEME_STORAGE_KEY = 'i18nprune-runtime-web-theme';

export function renderSwaggerThemeScript(storageKey: string = SWAGGER_THEME_STORAGE_KEY): string {
  const key = JSON.stringify(storageKey);
  return `(function () {
  var KEY = ${key};
  var mode = 'system';
  try {
    var stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') mode = stored;
  } catch (e) {}

  function resolveDark() {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme() {
    var dark = resolveDark();
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }

  function setMode(next) {
    mode = next;
    try {
      localStorage.setItem(KEY, mode);
    } catch (e) {}
    applyTheme();
  }

  applyTheme();

  window.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('i18nprune-swagger-theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      setMode(resolveDark() ? 'light' : 'dark');
    });
  });

  if (mode === 'system') {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', function () {
        if (mode === 'system') applyTheme();
      });
    }
  }
})();`;
}
