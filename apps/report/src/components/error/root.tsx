import React, { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen.js';

type BoundaryProps = { children: ReactNode };
type BoundaryState = { error?: Error };

/** Catches React render/lifecycle errors in the report UI tree. */
export class RootErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  public state: BoundaryState = {};

  public static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {}

  public render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorScreen
          title="Report UI crashed"
          message={this.state.error.message || 'Unknown rendering error.'}
        />
      );
    }
    return this.props.children;
  }
}

type SurfaceProps = { children: ReactNode };

/**
 * Top-level handlers for non-React failures (sync throws in handlers, unhandled promise rejections).
 * Renders a full-screen message so the file is never a silent blank page.
 */
export function GlobalErrorSurface({ children }: SurfaceProps): JSX.Element {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onError = (ev: ErrorEvent): void => {
      if (ev.target != null && ev.target !== window) return;
      const msg = ev.error instanceof Error ? ev.error.message : String(ev.message || 'Unknown error');
      setMessage(msg);
    };
    const onRejection = (ev: PromiseRejectionEvent): void => {
      const r = ev.reason;
      const msg = r instanceof Error ? r.message : String(r);
      setMessage(msg);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (message) {
    return <ErrorScreen title="Report runtime error" message={message} />;
  }
  return <>{children}</>;
}
