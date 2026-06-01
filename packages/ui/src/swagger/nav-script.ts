/** Sidebar nav for worker /docs shell (width &lt; 770px). */
export const SWAGGER_COMPACT_NAV_MQ = '(max-width: 769px)';

export function renderSwaggerNavScript(): string {
  const mq = JSON.stringify(SWAGGER_COMPACT_NAV_MQ);
  return `(function () {
  var MQ = ${mq};
  var openBtn = document.getElementById('i18nprune-swagger-nav-open');
  var closeBtn = document.getElementById('i18nprune-swagger-nav-close');
  var backdrop = document.getElementById('i18nprune-swagger-nav-backdrop');
  var sidebar = document.getElementById('i18nprune-swagger-nav-sidebar');
  if (!openBtn || !sidebar || !backdrop) return;

  function setOpen(next) {
    var open = !!next;
    sidebar.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('i18nprune-swagger-nav-open', open);
  }

  openBtn.addEventListener('click', function () {
    setOpen(!sidebar.classList.contains('is-open'));
  });
  if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });
  backdrop.addEventListener('click', function () { setOpen(false); });

  sidebar.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  var media = window.matchMedia(MQ);

  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!el.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!media.matches) return;
    if (e.key !== 'b' || !(e.ctrlKey || e.metaKey)) return;
    if (isTypingTarget(e.target)) return;
    e.preventDefault();
    setOpen(!sidebar.classList.contains('is-open'));
  });

  function onMq() {
    if (!media.matches) setOpen(false);
  }
  onMq();
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onMq);
  } else if (typeof media.addListener === 'function') {
    media.addListener(onMq);
  }
})();`;
}
