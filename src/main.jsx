import '@/index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorComponent from "@/components/ui/Error";

// Enhanced SDK loading with better error handling and retry logic
class ApperSDK {
  constructor() {
    this.isLoaded = false;
    this.loadPromise = null;
    this.isInitialized = false;
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

      const script = document.createElement('script');
      script.src = import.meta.env.VITE_APPER_SDK_CDN_URL;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      
      let timeoutId;
      let isResolved = false;
      
      // Add script load success handler
      script.onload = () => {
        if (isResolved) return;
        
        console.log('Apper SDK script loaded successfully');
        clearTimeout(timeoutId);
        
        // Wait a bit for SDK to initialize
        setTimeout(() => {
          if (isResolved) return;
          
          // Check if SDK is available and properly initialized
          if (typeof window.Apper !== 'undefined' && typeof window.Apper.init === 'function') {
            this.isLoaded = true;
            isResolved = true;
            console.log('Apper SDK is available and ready');
            resolve();
          } else {
            const errorMsg = window.Apper 
              ? 'Apper SDK script loaded but init method is not available' 
              : 'Apper SDK script loaded but SDK object is not available';
            console.error(errorMsg);
            isResolved = true;
            reject(new Error(errorMsg));
          }
        }, 500); // Give SDK time to initialize
      };
      
      // Add script load error handler
      script.onerror = (error) => {
        if (isResolved) return;
        
        clearTimeout(timeoutId);
        isResolved = true;
        console.error('Failed to load Apper SDK script:', error);
        reject(new Error(`Failed to load Apper SDK script: Network error or invalid URL`));
      };
      
      // Add script to document head
      document.head.appendChild(script);
      
      // Add timeout fallback with better error detection
      timeoutId = setTimeout(() => {
        if (isResolved) return;
        
        isResolved = true;
        
        // Check current state for better error message
        if (document.head.contains(script)) {
          const errorMsg = window.Apper 
            ? (typeof window.Apper.init === 'function' 
                ? 'Apper SDK loaded but initialization timeout' 
                : 'Apper SDK object exists but missing init method')
            : 'Apper SDK script loading timeout - check network connection and SDK URL';
          console.error(errorMsg);
          reject(new Error(errorMsg));
        } else {
          reject(new Error('Apper SDK script element was removed from DOM'));
        }
      }, 20000); // Increased timeout for better reliability
    });

    return this.loadPromise;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadSDK();
      
      // Initialize the SDK with proper configuration
      const config = {
        canvas: {
          minWidth: 1,
          minHeight: 1,
          validateDimensions: true,
          fallbackDimensions: { width: 300, height: 200 }
        },
        // Error handling configuration
        errorHandling: {
          logErrors: true,
          retryFailedOperations: true
        }
      };

      if (window.Apper && typeof window.Apper.init === 'function') {
        await window.Apper.init(config);
        this.isInitialized = true;
        console.log('Apper SDK initialized successfully');
      } else {
        throw new Error('Apper SDK not available for initialization');
      }
    } catch (error) {
      console.error('Failed to initialize Apper SDK:', error);
      throw error;
    }
  }

  renderToCanvas(canvasElement, options = {}) {
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

      // Call SDK render method
      if (typeof window.Apper.render === 'function') {
        window.Apper.render(canvasElement, options);
      }
    } catch (error) {
      console.error('Error rendering to canvas:', error);
    }
  }
}

// Global SDK instance
window.apperSDK = new ApperSDK();

// Create error boundary wrapper
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
    
    // Log SDK-specific errors
    if (error.message?.includes('Apper SDK')) {
      console.error('SDK Error Details:', {
        sdkAvailable: typeof window.Apper !== 'undefined',
        initMethod: typeof window.Apper?.init === 'function',
        timestamp: new Date().toISOString()
      });
    }

    // Check for canvas or SDK-related errors
    if (error.message && (error.message.includes('canvas') || 
        error.message.includes('drawImage') ||
        error.message.includes('apper'))) {
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

// Initialize the application with retry logic
async function initializeApp(retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`Starting application initialization... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Load and initialize SDK
    const sdk = new ApperSDK();
    await sdk.loadSDK();
    await sdk.initialize();
    
    console.log('SDK initialized successfully');
    
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
    console.error(`Failed to initialize application (attempt ${retryCount + 1}):`, error);
    
    // Retry logic for network-related errors
    if (retryCount < maxRetries && (
      error.message?.includes('timeout') || 
      error.message?.includes('Network error') ||
      error.message?.includes('Failed to load')
    )) {
      console.log(`Retrying initialization in ${(retryCount + 1) * 2} seconds...`);
      setTimeout(() => initializeApp(retryCount + 1), (retryCount + 1) * 2000);
      return;
    }
    
    // Render error fallback
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <ErrorComponent 
              error={error}
              retry={() => initializeApp(0)}
            />
          </ErrorBoundary>
        </React.StrictMode>
      );
    }
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