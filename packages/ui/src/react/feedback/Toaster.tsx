import type { ComponentType, ReactElement } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import type { ToasterProps } from 'sonner';
import { useTheme } from '../theme/ThemeProvider.js';

const ToasterRoot = SonnerToaster as ComponentType<ToasterProps>;

export function Toaster(props: ToasterProps): ReactElement {
  const { theme } = useTheme();
  return (
    <ToasterRoot
      theme={theme}
      richColors
      closeButton
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'i18nprune-toast',
        },
      }}
      {...props}
    />
  );
}
