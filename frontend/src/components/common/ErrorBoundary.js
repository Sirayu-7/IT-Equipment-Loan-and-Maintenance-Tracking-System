import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px',
          }}>
            ⚠️
          </div>
          <h1 style={{ marginBottom: '16px', color: '#e74c3c' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '24px', color: '#666', maxWidth: '500px' }}>
            An unexpected error occurred. Please try refreshing the page or contact the IT department.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                fontSize: '16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                padding: '10px 24px',
                fontSize: '16px',
                backgroundColor: '#ecf0f1',
                color: '#333',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '32px', textAlign: 'left', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', color: '#888' }}>Error Details</summary>
              <pre style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#666',
                overflow: 'auto',
                maxHeight: '300px',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;