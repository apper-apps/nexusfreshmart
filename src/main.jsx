import '@/index.css';
import React from "react";
import ReactDOM from "react-dom/client";

// Performance monitoring
const performanceMonitor = {
  start: performance.now(),
  marks: {},
  
  mark(name) {
    this.marks[name] = performance.now();
    console.log(`Performance Mark [${name}]: ${(this.marks[name] - this.start).toFixed(2)}ms`);
  },
  
  measure(name, startMark) {
    const duration = this.marks[name] - (startMark ? this.marks[startMark] : this.start);
    console.log(`Performance Measure [${name}]: ${duration.toFixed(2)}ms`);
    return duration;
  }
};

// Background SDK loader - non-blocking
class BackgroundSDKLoader {
  constructor() {
    this.loadPromise = null;
    this.isLoaded = false;
    this.isInitialized = false;
  }

  async loadInBackground() {
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = new Promise((resolve) => {
      // Always resolve to prevent blocking
      const script = document.createElement('script');
      script.src = import.meta.env.VITE_APPER_SDK_CDN_URL || 'https://cdn.apper.io/apper-dev-script/index.umd.js';
      script.async = true;
      script.onload = () => {
        this.isLoaded = true;
        this.initializeWhenReady();
        resolve(true);
      };
      script.onerror = () => {
        console.warn('SDK failed to load - continuing without it');
        resolve(false);
      };
      document.head.appendChild(script);
    });
    
    return this.loadPromise;
  }

  async initializeWhenReady() {
    if (this.isInitialized) return;
    
    try {
      if (typeof window.Apper?.init === 'function') {
        await window.Apper.init({
          projectId: import.meta.env.VITE_APPER_PROJECT_ID,
          publicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
        });
        this.isInitialized = true;
        window.apperSDK = window.Apper;
        console.log('SDK initialized in background');
      }
    } catch (error) {
      console.warn('SDK initialization failed:', error);
    }
  }
}

// Lightweight error boundary for critical path
class FastErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Critical path error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fast app initialization - critical path only
async function initializeApp() {
  try {
    performanceMonitor.mark('app-start');
    
    // Start SDK loading in background (non-blocking)
    const sdkLoader = new BackgroundSDKLoader();
    sdkLoader.loadInBackground().catch(() => {}); // Fire and forget
    
    performanceMonitor.mark('sdk-started');
    
    // Get root element
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    performanceMonitor.mark('root-found');
    
    // Dynamic import for App component
    const { default: App } = await import('@/App');
    
    performanceMonitor.mark('app-loaded');
    
    // Render immediately - don't wait for SDK
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <FastErrorBoundary>
        <App />
      </FastErrorBoundary>
    );
    
    performanceMonitor.mark('app-rendered');
    
    const totalTime = performanceMonitor.measure('app-rendered', 'app-start');
    console.log(`🚀 App loaded in ${totalTime.toFixed(2)}ms`);
    
    // Performance check
    if (totalTime > 1000) {
      console.warn('⚠️ App load time exceeds 1 second target');
    } else {
      console.log('✅ App load time within 1 second target');
    }
    
  } catch (error) {
    console.error('App initialization failed:', error);
    
    // Fallback render
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-900 mb-4">Failed to load application</h1>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  }
}

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}