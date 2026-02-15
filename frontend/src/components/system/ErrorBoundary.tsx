import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled app error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell flex items-center justify-center px-4 py-10">
          <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Unexpected Error</p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Something went wrong.</h1>
            <p className="text-muted mt-3 text-sm sm:text-base">
              Refresh this page to recover. If it keeps happening, redeploy with the latest fixes.
            </p>
            <button onClick={this.handleReload} className="btn-primary mt-6 w-full sm:w-auto">
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
