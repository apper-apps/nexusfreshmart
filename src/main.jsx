import '@/index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorComponent from "@/components/ui/Error";

// Enhanced ApperSDK class with comprehensive error handling
class ApperSDK {
  constructor() {
    this.isLoaded = false;
    this.isInitialized = false;
    this.projectId = import.meta.env.VITE_APPER_PROJECT_ID;
    this.publicKey = import.meta.env.VITE_APPER_PUBLIC_KEY;
    this.cdnUrl = import.meta.env.VITE_APPER_SDK_CDN_URL;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.loadPromise = null;
    this.scriptLoadListeners = [];
  }

  async loadSDK() {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      let isResolved = false;
      let timeoutId = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        // Remove event listeners
        this.scriptLoadListeners.forEach(listener => {
          document.removeEventListener('DOMContentLoaded', listener);
          window.removeEventListener('load', listener);
        });
        this.scriptLoadListeners = [];
      };

      const resolveSuccess = () => {
        if (isResolved) return;
        isResolved = true;
        this.isLoaded = true;
        console.log('Apper SDK loaded and available');
        cleanup();
        resolve();
      };

      const rejectError = (error) => {
        if (isResolved) return;
        isResolved = true;
        console.error('Apper SDK loading failed:', error);
        cleanup();
        reject(error);
      };

      // Check if SDK is already loaded
      if (this.isLoaded && typeof window.Apper !== 'undefined' && typeof window.Apper.init === 'function') {
        resolveSuccess();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${this.cdnUrl}"]`);
      if (existingScript) {
        // Script exists, check if SDK is available
        if (typeof window.Apper !== 'undefined' && typeof window.Apper.init === 'function') {
          resolveSuccess();
          return;
        }
      } else {
        // Create and load script
        try {
          const script = document.createElement('script');
          script.src = this.cdnUrl;
          script.async = true;
          script.crossOrigin = 'anonymous';

          script.onload = () => {
            // Script loaded, but SDK might not be immediately available
            this.checkSDKAvailability(resolveSuccess, rejectError);
          };

          script.onerror = () => {
            rejectError(new Error('Failed to load Apper SDK script'));
          };

          document.head.appendChild(script);
        } catch (error) {
          rejectError(new Error(`Failed to create SDK script: ${error.message}`));
          return;
        }
      }

      // Set timeout for SDK loading
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          const status = this.getSDKStatus();
          const errorMsg = status.scriptLoaded 
            ? (status.sdkAvailable 
                ? 'Apper SDK loaded but init method is not available' 
                : 'Apper SDK script loaded but SDK object is not available')
            : 'Apper SDK script failed to load within timeout';
          rejectError(new Error(errorMsg));
        }
      }, 10000); // 10 second timeout

      // If script already exists, check SDK availability
      if (existingScript) {
        this.checkSDKAvailability(resolveSuccess, rejectError);
      }
    });

    return this.loadPromise;
  }

  checkSDKAvailability(onSuccess, onError, maxAttempts = 20) {
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      try {
        if (typeof window.Apper !== 'undefined' && typeof window.Apper.init === 'function') {
          clearInterval(checkInterval);
          onSuccess();
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          const status = this.getSDKStatus();
          const errorMsg = status.sdkAvailable 
            ? 'Apper SDK object available but init method is missing'
            : 'Apper SDK object is not available after script load';
          onError(new Error(errorMsg));
          return;
        }
      } catch (error) {
        clearInterval(checkInterval);
        onError(new Error(`Error checking SDK availability: ${error.message}`));
        return;
      }
    }, 100); // Check every 100ms
  }

  getSDKStatus() {
    return {
      scriptLoaded: !!document.querySelector(`script[src="${this.cdnUrl}"]`),
      sdkAvailable: typeof window.Apper !== 'undefined',
      initAvailable: typeof window.Apper?.init === 'function',
      ready: typeof window.Apper !== 'undefined' && typeof window.Apper.init === 'function'
    };
  }

  async initialize() {
    try {
      // Ensure SDK is loaded first
      await this.loadSDK();
      
      // Check if already initialized
      if (this.isInitialized) {
        return;
      }

      // Validate environment variables
      if (!this.projectId || !this.publicKey) {
        throw new Error('Missing required environment variables: VITE_APPER_PROJECT_ID or VITE_APPER_PUBLIC_KEY');
      }

      // Validate SDK availability before initialization
      if (typeof window.Apper?.init !== 'function') {
        throw new Error('Apper SDK init method is not available');
      }

      // Initialize SDK with timeout
      const initPromise = window.Apper.init({
        projectId: this.projectId,
        publicKey: this.publicKey
      });

      // Add timeout to init call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SDK initialization timeout')), 15000);
      });
await Promise.race([initPromise, timeoutPromise]);

      this.isInitialized = true;
      console.log('Apper SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Apper SDK:', error);
      throw error;
    }
  }

  async renderToCanvas(canvasElement, options = {}) {
    try {
      // Ensure SDK is initialized
      await this.initialize();
      
      // Validate canvas element
      if (!canvasElement || typeof canvasElement.getContext !== 'function') {
        throw new Error('Invalid canvas element provided');
      }

      // Validate SDK availability
      if (typeof window.Apper?.renderToCanvas !== 'function') {
        throw new Error('Apper SDK renderToCanvas method is not available');
      }

      // Render to canvas with timeout
      const renderPromise = window.Apper.renderToCanvas(canvasElement, options);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Canvas rendering timeout')), 10000);
      });

      await Promise.race([renderPromise, timeoutPromise]);
      console.log('Canvas rendered successfully');
    } catch (error) {
      console.error('Failed to render to canvas:', error);
      throw error;
    }
  }
}

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Categorize error for better handling
    const errorType = this.categorizeError(error);
    
    this.setState({
      error,
      errorInfo,
      errorType
    });
  }

  categorizeError(error) {
    if (!error) return 'unknown';
    
    const message = error.message || '';
    if (message.includes('Apper') || message.includes('SDK')) {
      return 'sdk';
    }
    if (message.includes('Network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('Canvas') || message.includes('render')) {
      return 'canvas';
}
    return 'unknown';
  }

  // Enhanced retry logic with proper async handling and circuit breaker
  handleRetry = async () => {
    if (this.state.retryCount >= this.state.maxRetries) {
      console.warn('Max retries reached, entering fallback mode');
      // Enter fallback mode instead of blocking
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        fallbackMode: true
      });
      return;
    }

    console.log(`Retry attempt ${this.state.retryCount + 1}/${this.state.maxRetries}`);
    
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      isRetrying: true
    }));

    try {
      // Add delay before retry to prevent rapid failures
      await new Promise(resolve => setTimeout(resolve, 1000 * this.state.retryCount));
      
      // Reset error state first
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false
      });

      // If it's an SDK error, try to reinitialize with better error handling
      if (this.state.errorType === 'sdk') {
        try {
          // Clear any existing SDK instances
          if (window.apperSDK) {
            window.apperSDK = null;
          }
          
          // Wait for SDK to be available
          await new Promise((resolve, reject) => {
            let attempts = 0;
            const checkSDK = () => {
              if (typeof window.Apper !== 'undefined' && window.Apper.init) {
                resolve();
              } else if (attempts >= 10) {
                reject(new Error('SDK not available after retry'));
              } else {
                attempts++;
                setTimeout(checkSDK, 500);
              }
            };
            checkSDK();
          });

          // Initialize new SDK instance
          const sdk = new ApperSDK();
          await sdk.initialize();
          
          console.log('SDK retry successful');
        } catch (sdkError) {
          console.error('SDK retry failed:', sdkError);
          throw sdkError;
        }
      }
      
      // Force re-render of children
      this.forceUpdate();
      
    } catch (error) {
      console.error('Retry failed:', error);
      this.setState({ 
        hasError: true, 
        error: error,
        errorInfo: { componentStack: error.stack },
        isRetrying: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < this.state.maxRetries;
      
      return (
        <ErrorComponent 
          message={this.state.error?.message || 'An unexpected error occurred'} 
          onRetry={canRetry ? this.handleRetry : undefined}
          type={this.state.errorType}
          retryCount={this.state.retryCount}
          maxRetries={this.state.maxRetries}
        />
      );
    }

    return this.props.children;
  }
}
render() {
    // If in fallback mode, render app without SDK features
    if (this.state.fallbackMode) {
      console.log('Rendering in fallback mode without SDK');
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Running in limited mode. Some features may not be available.
                </p>
              </div>
            </div>
          </div>
          {this.props.children}
        </div>
      );
    }

    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      const isSDKError = errorMessage.includes('Apper') || errorMessage.includes('SDK');
      
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="text-6xl text-red-500 mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {isSDKError ? 'SDK Loading Error' : 'Application Error'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {isSDKError 
                    ? 'The application SDK failed to initialize. This might be due to network issues or server problems.'
                    : errorMessage
                  }
                </p>
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= this.state.maxRetries || this.state.isRetrying}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {this.state.isRetrying
                      ? 'Retrying...'
                      : this.state.retryCount >= this.state.maxRetries 
                        ? 'Continue in Limited Mode' 
                        : `Retry (${this.state.retryCount}/${this.state.maxRetries})`
                    }
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize app function
async function initializeApp(retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 1000;
  
  try {
    // Initialize SDK
    const sdk = new ApperSDK();
    await sdk.initialize();
    
    // Initialize React app
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    
    console.log('App initialized successfully');
} catch (error) {
    console.error('App initialization failed:', error);
    
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);
      
      setTimeout(() => {
        initializeApp(retryCount + 1);
      }, delay);
    } else {
      console.error('Max retries reached, showing error page');
      
      // Show error page as fallback
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
          <ErrorComponent 
            message={error.message || 'Failed to initialize application'} 
            onRetry={() => window.location.reload()}
            type="initialization"
          />
        );
      }
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  initializeApp();
}