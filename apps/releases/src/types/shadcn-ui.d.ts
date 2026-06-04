import type { ComponentType, ReactNode } from 'react';

type UiProps = {
  children?: ReactNode;
  className?: string;
  variant?: string;
  size?: string;
  asChild?: boolean;
  align?: string;
  sideOffset?: number;
  onClick?: () => void;
};

declare module '@/components/ui/button' {
  export const Button: ComponentType<UiProps>;
  export const buttonVariants: (...args: unknown[]) => string;
}

declare module '@/components/ui/dropdown-menu' {
  export const DropdownMenu: ComponentType<UiProps>;
  export const DropdownMenuTrigger: ComponentType<UiProps>;
  export const DropdownMenuContent: ComponentType<UiProps>;
  export const DropdownMenuItem: ComponentType<UiProps>;
}
