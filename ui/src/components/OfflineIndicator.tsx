import { useState, useEffect } from 'react';
import { Message } from 'primereact/message';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBackOnline(true);
        // Hide "back online" message after 3 seconds
        setTimeout(() => {
          setShowBackOnline(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Don't show anything if online and haven't been offline
  if (isOnline && !showBackOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      {!isOnline && (
        <Message
          severity="warn"
          text="You're offline. Some features may be limited. Your data is cached and will sync when you're back online."
          style={{
            width: '100%',
            borderRadius: 0,
            margin: 0,
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none'
          }}
          icon="pi pi-wifi"
        />
      )}
      {showBackOnline && (
        <Message
          severity="success"
          text="You're back online! Syncing data..."
          style={{
            width: '100%',
            borderRadius: 0,
            margin: 0,
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none'
          }}
          icon="pi pi-check-circle"
        />
      )}
    </div>
  );
};
