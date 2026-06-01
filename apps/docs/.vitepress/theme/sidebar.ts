/** Doc sidebar overlay (VPSidebar) — below VitePress desktop sidebar breakpoint. */
export const DOCS_SIDEBAR_SHORTCUT_MQ = '(max-width: 959px)'

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el?.tagName) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return el.isContentEditable
}

function menuButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('.VPLocalNav button.menu')
}

function isDocsSidebarOpen(): boolean {
  const btn = menuButton()
  if (btn) return btn.getAttribute('aria-expanded') === 'true'
  return document.querySelector('.VPSidebar.open') !== null
}

/** VitePress Menu only opens; close via the same backdrop as a tap outside. */
function toggleDocsSidebar(): void {
  if (isDocsSidebarOpen()) {
    document.querySelector<HTMLElement>('.VPBackdrop')?.click()
    return
  }
  menuButton()?.click()
}

function decorateMenuButton(): void {
  const btn = menuButton()
  if (!btn) return
  btn.setAttribute('aria-keyshortcuts', 'Control+B')
  const label = btn.querySelector('.menu-text')?.textContent?.trim() ?? 'Menu'
  if (!btn.getAttribute('aria-label')?.includes('Ctrl+B')) {
    btn.setAttribute('aria-label', `${label} — toggle (Ctrl+B)`)
  }
}

export function registerDocsSidebar(): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'b' || !(e.ctrlKey || e.metaKey)) return
    if (!window.matchMedia(DOCS_SIDEBAR_SHORTCUT_MQ).matches) return
    if (isTypingTarget(e.target)) return
    if (!menuButton()) return
    e.preventDefault()
    toggleDocsSidebar()
  })

  decorateMenuButton()
  const observer = new MutationObserver(() => decorateMenuButton())
  observer.observe(document.body, { childList: true, subtree: true })
}
