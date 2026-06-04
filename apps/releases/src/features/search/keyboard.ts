/** Same guards as apps/web and apps/report RuntimeHeader. */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

export function focusReleaseSearch(): void {
  const el = document.querySelector<HTMLInputElement>('[data-release-search]');
  el?.focus();
  el?.select();
}
