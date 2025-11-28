import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
      };
    }
  }
}

const ConvAIChatbot: React.FC = () => {
  const location = useLocation();
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Check if current route is login or signup
  const isLoginOrSignup = location.pathname.includes('/login') || location.pathname.includes('/signup');

  // Debug logging - more detailed
  console.log('ConvAIChatbot render:', { 
    currentPath: location.pathname,
    isLoginOrSignup,
    shouldShow: !isLoginOrSignup,
    isDashboard: location.pathname.includes('/dashboard')
  });

  useEffect(() => {
    // Only load the script if NOT on login or signup pages
    if (!isLoginOrSignup) {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="convai-widget-embed"]');
      
      if (!existingScript) {
        console.log('Loading ConvAI script for path:', location.pathname);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        script.type = 'text/javascript';
        
        // Add load event listener
        script.onload = () => {
          console.log('ConvAI script loaded successfully');
        };
        
        script.onerror = () => {
          console.error('Failed to load ConvAI script');
        };
        
        document.head.appendChild(script);
        scriptRef.current = script;
      } else {
        console.log('ConvAI script already exists');
      }
    } else {
      console.log('Cleaning up ConvAI for login/signup page');
      // Clean up: remove script and widget when on login/signup pages
      const existingScript = document.querySelector('script[src*="convai-widget-embed"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Also remove any existing chatbot widgets
      const existingWidget = document.querySelector('elevenlabs-convai');
      if (existingWidget) {
        existingWidget.remove();
      }
      
      scriptRef.current = null;
    }

    // Cleanup function
    return () => {
      if (isLoginOrSignup) {
        const existingScript = document.querySelector('script[src*="convai-widget-embed"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        const existingWidget = document.querySelector('elevenlabs-convai');
        if (existingWidget) {
          existingWidget.remove();
        }
      }
    };
  }, [isLoginOrSignup]);

  // Only render the chatbot widget if NOT on login or signup pages
  if (isLoginOrSignup) {
    console.log('ConvAI widget hidden on login/signup page');
    return null;
  }

  console.log('ConvAI widget rendering for path:', location.pathname);
  return (
    <elevenlabs-convai agent-id="agent_7801k13egrf7eta82k8zzzq4s53a" />
  );
};

export default ConvAIChatbot;
