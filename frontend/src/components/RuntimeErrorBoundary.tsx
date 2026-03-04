import React, { Component, ErrorInfo, ReactNode } from 'react';
import RuntimeErrorScreen from '../pages/RuntimeErrorScreen';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RuntimeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Runtime error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <RuntimeErrorScreen error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default RuntimeErrorBoundary;
