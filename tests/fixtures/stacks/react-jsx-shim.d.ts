/**
 * Minimal JSX typings for stack fixtures — no per-fixture `react` install.
 * Pair with `compilerOptions.jsx: "react-jsx"` in `tsconfig.json`.
 */
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}

declare module 'react/jsx-runtime' {
  export function jsx(type: unknown, props: unknown, key?: string): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: string): JSX.Element;
  export const Fragment: unique symbol;
}
