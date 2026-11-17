import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="page page-narrow checkout-result">
          <h1 className="page-title">Something broke</h1>
          <p className="page-intro">
            Sorry about that. Reloading usually fixes it. Your cart is saved. If it keeps happening, email{' '}
            <a href="mailto:contact@gcccontrollers.com">contact@gcccontrollers.com</a>
            {this.state.error?.message ? ` and mention: “${this.state.error.message}”` : ''}.
          </p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
