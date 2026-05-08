import type { ReactNode } from "react";

export type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  /** Narrow layouts (e.g. story column) */
  maxWidthClass?: string;
  children?: ReactNode;
};
