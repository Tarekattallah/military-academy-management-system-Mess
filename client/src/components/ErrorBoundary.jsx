import { Component } from 'react';










export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
          <div className="max-w-lg w-full rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-destructive">حدث خطأ في التطبيق</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {this.state.error?.message || 'خطأ غير معروف'}
            </p>
            <pre className="mb-4 overflow-auto rounded bg-secondary p-3 text-xs text-left text-muted-foreground max-h-48">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              
              حاول مجدداً
            </button>
          </div>
        </div>);

    }
    return this.props.children;
  }
}