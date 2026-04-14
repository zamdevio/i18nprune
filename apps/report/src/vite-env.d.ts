/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Dev-only; production embed uses `#i18nprune-inline-payload`. */
    __I18NPRUNE_REPORT__?: string;
  }
}
