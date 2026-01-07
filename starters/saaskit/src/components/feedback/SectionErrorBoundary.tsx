"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorCard } from "./ErrorCard";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
};

interface State {
  hasError: boolean;
  error: Error | null;
};

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SectionErrorBoundary caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorCard
          title="This section encountered an error"
          message={this.state.error?.message ?? undefined}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
