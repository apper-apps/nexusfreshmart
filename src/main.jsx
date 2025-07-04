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
      this.isInitialized = false;
      throw error;
    }
  }

  async renderToCanvas(canvasElement, options = {}) {
    try {
      // Ensure SDK is initialized
      await this.initialize();
      
      // Validate canvas element
      if (!canvasElement) {
        throw new Error('Canvas element is required');
      }

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
    return 'application';
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.state.maxRetries) {
      console.warn('Max retries reached, not retrying');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }));

    try {
      // Reset error state
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null 
      });

      // If it's an SDK error, try to reinitialize
      if (this.state.errorType === 'sdk') {
        const sdk = new ApperSDK();
        await sdk.initialize();
      }
    } catch (error) {
      console.error('Retry failed:', error);
      this.setState({ 
        hasError: true, 
        error: error,
        errorInfo: { componentStack: error.stack }
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

// Enhanced app initialization with comprehensive error handling
async function initializeApp(retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 1000;
  
  try {
    console.log(`Initializing app (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Validate environment variables
    if (!import.meta.env.VITE_APPER_PROJECT_ID || !import.meta.env.VITE_APPER_PUBLIC_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize SDK with proper error handling
    const sdk = new ApperSDK();
    await sdk.initialize();
    
    // Store SDK instance globally for access
    window.apperSDK = sdk;
    
    // Get root element with validation
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // Create React root and render app
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
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