import { Component } from 'preact'
import { useState, useEffect } from 'preact/hooks'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error: error.message }
  }

  componentDidCatch(error) {
    console.error(error)
    this.setState({ error: error.message })
  }

  render() {
    if (this.state.error) {
      // div that renders as a red background with white text centered in the page:
      return <div class="flex items-center justify-center">
        <div class="bg-red-500 text-white px-6 py-4 rounded-lg text-center w-full max-w-lg">Error: {this.state.error}</div>
      </div>;
    }
    return this.props.children
  }
}

export const ErrorCatcher = () => {
  const [error, setError] = useState(null);
  useEffect(() => {
    const handler = (event) => {
      if (event.reason) {
        // Promise case
        setError(event.reason);
      } else if (event.error) {
        // Normal non-Promise error
        setError(event.error);
      } else {
        // Something else
        setError({
          message: event + ""
        });
      }
      console.error("Error caught by ErrorCatcher:", event);
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", handler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", handler);
    };
  }, []);
  if (!error) {
    return null;
  }
  return <div class="flex items-center justify-center">
    <div class="bg-red-500 text-white px-6 py-4 rounded-lg text-center w-full max-w-lg">Uncaught error: {error.message}</div>
  </div>;
};
