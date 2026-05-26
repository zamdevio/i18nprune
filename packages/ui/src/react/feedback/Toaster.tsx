import { Toaster as SonnerToaster } from 'sonner';
import type { ToasterProps } from 'sonner';
import { useTheme } from '../theme/ThemeProvider.js';

export function Toaster(props: ToasterProps): JSX.Element {
  const { theme } = useTheme();
  return (
    <SonnerToaster
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
