import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorComponent from "@/components/ui/Error";
// Apper SDK integration
class ApperSDK {
  constructor() {
    this.isLoaded = false;
    this.isInitialized = false;
    this.loadPromise = null;
  }

  async loadSDK() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.Apper && typeof window.Apper.init === 'function') {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = import.meta.env.VITE_APPER_SDK_CDN_URL || 'https://cdn.apper.io/v1/apper-sdk.v1.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        console.log('Apper SDK loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('Failed to load Apper SDK:', error);
        reject(new Error('Failed to load Apper SDK'));
      };

      // Add to document head
      document.head.appendChild(script);

      // Timeout fallback
      setTimeout(() => {
        if (!this.isLoaded) {
          reject(new Error('Apper SDK loading timeout'));
        }
      }, 10000);
    });

    return this.loadPromise;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadSDK();
      
      if (!window.Apper) {
        throw new Error('Apper SDK not available after loading');
      }

      // Initialize with proper configuration
      const config = {
        projectId: import.meta.env.VITE_APPER_PROJECT_ID,
        publicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
        // Canvas-specific configurations to prevent rendering errors
        canvas: {
          minWidth: 1,
          minHeight: 1,
          validateDimensions: true,
          fallbackDimensions: { width: 300, height: 200 }
        },
        // Error handling configuration
        onError: (error) => {
          console.error('Apper SDK Error:', error);
          // Don't throw - allow app to continue
        },
        // Prevent canvas rendering until properly sized
        autoRender: false
      };

      await window.Apper.init(config);
      this.isInitialized = true;
      console.log('Apper SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Apper SDK:', error);
      // Don't throw - allow app to continue without SDK
    }
  }

  // Method to safely render canvas with dimension validation
  async safeRender(canvasElement, options = {}) {
    if (!this.isInitialized || !window.Apper) {
      console.warn('Apper SDK not initialized, skipping render');
      return;
    }

    try {
      // Validate canvas dimensions
      const rect = canvasElement.getBoundingClientRect();
      const width = options.width || rect.width || 300;
      const height = options.height || rect.height || 200;

      if (width <= 0 || height <= 0) {
        console.warn('Invalid canvas dimensions, using fallback');
        canvasElement.width = 300;
        canvasElement.height = 200;
      } else {
        canvasElement.width = width;
        canvasElement.height = height;
      }

      // Ensure canvas is properly sized before rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (window.Apper.render) {
        await window.Apper.render(canvasElement, options);
      }
    } catch (error) {
      console.error('Canvas rendering error:', error);
      // Don't throw - gracefully handle the error
    }
  }
}

// Global SDK instance
window.apperSDK = new ApperSDK();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if it's an Apper SDK related error
    if (error.message && error.message.includes('canvas') || 
        error.message.includes('drawImage') ||
        error.message.includes('apper')) {
      console.error('Apper SDK related error detected');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
}

    return this.props.children;
  }
}

// Initialize SDK and render app
async function initializeApp() {
  try {
    // Initialize Apper SDK first
    await window.apperSDK.initialize();
    
    // Render the React app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
);
    
    // Dispatch ready event after successful initialization
    const readyEvent = new window.CustomEvent('reactReady');
    window.dispatchEvent(readyEvent);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Render app without SDK if initialization fails
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
}

// Start the app
initializeApp().catch(error => {
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
});