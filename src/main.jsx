import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";

// Error boundary for external script conflicts
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { 
        style: { 
          padding: '20px', 
          textAlign: 'center',
          color: '#F44336'
        } 
      }, 'Something went wrong. Please refresh the page.');
    }

    return this.props.children;
  }
}

// Defensive initialization with error handling
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    React.createElement(ErrorBoundary, null,
      React.createElement(App, null)
    )
  );
  
  // Signal that React is ready for external scripts
  window.reactAppReady = true;
  window.dispatchEvent(new CustomEvent('reactReady'));
  
} catch (error) {
  console.error('Failed to initialize React application:', error);
  
  // Fallback rendering
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #F44336;">
        <h2>Application Error</h2>
        <p>Failed to load the application. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #2E7D32; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
}