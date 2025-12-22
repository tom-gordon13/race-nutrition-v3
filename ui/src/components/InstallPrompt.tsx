import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as iOS PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone;
    if (isIOS && isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Auto-show prompt after user has been on site for 30 seconds
      // Only if they haven't dismissed it before
      setTimeout(() => {
        const dismissed = localStorage.getItem('installPromptDismissed');
        const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
        const dayInMs = 24 * 60 * 60 * 1000;

        // Show again if dismissed more than a day ago, or never dismissed
        if (!dismissed || Date.now() - dismissedTime > dayInMs) {
          setShowPrompt(true);
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.removeItem('installPromptDismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {/* Floating install button */}
      {!showPrompt && deferredPrompt && (
        <Button
          icon="pi pi-download"
          label="Install App"
          onClick={() => setShowPrompt(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          severity="secondary"
          raised
        />
      )}

      {/* Install dialog */}
      <Dialog
        header="Install RaceFuel"
        visible={showPrompt}
        onHide={handleDismiss}
        style={{ width: '90vw', maxWidth: '400px' }}
        modal
        dismissableMask
      >
        <div style={{ padding: '1rem' }}>
          <p style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            Install RaceFuel for a better experience:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li>Quick access from your home screen</li>
            <li>Works offline during races</li>
            <li>Faster performance</li>
            <li>Full-screen experience</li>
            <li>No browser navigation bar</li>
          </ul>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button
              label="Install"
              onClick={handleInstallClick}
              style={{ flex: 1 }}
              severity="success"
              icon="pi pi-download"
            />
            <Button
              label="Maybe Later"
              onClick={handleDismiss}
              style={{ flex: 1 }}
              outlined
              icon="pi pi-times"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};
