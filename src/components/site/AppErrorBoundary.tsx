import { Component, type ReactNode, type ErrorInfo } from "react";
import { GlobalErrorFallback } from "./GlobalErrorFallback";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  boundary?: string;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.boundary ?? "AppErrorBoundary"}]`, error, info);
    reportLovableError(error, {
      boundary: this.props.boundary ?? "AppErrorBoundary",
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <GlobalErrorFallback
          error={this.state.error}
          reset={this.reset}
          boundary={this.props.boundary}
        />
      );
    }
    return this.props.children;
  }
}
