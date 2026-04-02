import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    let detailedInfo = '';
    try {
      // Check if it's a Firestore error JSON
      const info = JSON.parse(error.message);
      detailedInfo = JSON.stringify(info, null, 2);
    } catch (e) {
      detailedInfo = error.stack || '';
    }
    
    this.setState({ errorInfo: detailedInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="glass-card p-8 rounded-3xl max-w-2xl w-full border border-red-500/30">
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground">The application encountered an unexpected error.</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 mb-6 overflow-auto max-h-64 font-mono text-xs text-red-400/80">
              <p className="font-bold mb-2">{this.state.error?.toString()}</p>
              {this.state.errorInfo && (
                <pre className="whitespace-pre-wrap">{this.state.errorInfo}</pre>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
            >
              <RefreshCw size={20} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
