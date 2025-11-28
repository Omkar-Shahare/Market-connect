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

const ConvAIChatbotTest: React.FC = () => {
  const location = useLocation();
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Debug logging - detailed
  console.log('ConvAIChatbotTest render:', { 
    currentPath: location.pathname,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('ConvAIChatbotTest useEffect triggered for path:', location.pathname);
    
    // Always load the script for testing
    const existingScript = document.querySelector('script[src*="convai-widget-embed"]');
    
    if (!existingScript) {
      console.log('Loading ConvAI script...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.head.appendChild(script);
      scriptRef.current = script;
    } else {
      console.log('ConvAI script already exists');
    }
  }, [location.pathname]);

  console.log('ConvAIChatbotTest rendering widget for path:', location.pathname);

  return (
    <elevenlabs-convai agent-id="agent_7801k13egrf7eta82k8zzzq4s53a" />
  );
};

export default ConvAIChatbotTest;
