/// <reference types="vite/client" />

declare global {
  /** Injected in VS Code webviews only. */
  var acquireVsCodeApi: undefined | (() => { postMessage(message: unknown): void });
}

export {};
