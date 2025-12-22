import { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt = () => {
  const toast = useRef<Toast>(null);
  const [showToast, setShowToast] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh && !showToast) {
      setShowToast(true);
      toast.current?.show({
        severity: 'info',
        summary: 'Update Available',
        sticky: true,
        content: (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.5rem' }}>
            <i className="pi pi-info-circle" style={{ fontSize: '1.5rem', color: '#0ea5e9' }}></i>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Update Available</div>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', opacity: 0.9 }}>
                A new version of RaceFuel is available with improvements and bug fixes.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  label="Update Now"
                  onClick={() => updateServiceWorker(true)}
                  size="small"
                  icon="pi pi-refresh"
                  severity="info"
                />
                <Button
                  label="Later"
                  onClick={() => {
                    setNeedRefresh(false);
                    setShowToast(false);
                  }}
                  size="small"
                  text
                />
              </div>
            </div>
          </div>
        )
      });
    }
  }, [needRefresh, showToast, updateServiceWorker, setNeedRefresh]);

  return <Toast ref={toast} position="top-center" />;
};
