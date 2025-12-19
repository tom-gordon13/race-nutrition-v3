import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import './EventAnalyticsDialog.css';

interface EventAnalyticsDialogProps {
  visible: boolean;
  onHide: () => void;
}

export const EventAnalyticsDialog = ({
  visible,
  onHide
}: EventAnalyticsDialogProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const footerContent = (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button
        label="Close"
        icon="pi pi-times"
        onClick={onHide}
        severity="secondary"
        raised
        style={{ flex: 1, backgroundColor: '#6b7280', borderColor: '#6b7280', color: 'white', fontWeight: 600 }}
      />
    </div>
  );

  return (
    <Dialog
      header="Event Analytics"
      visible={visible}
      style={isMobile ? { width: '100vw', height: '85vh' } : { width: '70vw', minWidth: '800px', height: '80vh' }}
      onHide={onHide}
      footer={footerContent}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={!isMobile}
      className="event-analytics-dialog"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
        <p style={{ fontSize: '1.5rem', color: '#6b7280', textAlign: 'center' }}>
          Analytics coming soon...
        </p>
      </div>
    </Dialog>
  );
};
