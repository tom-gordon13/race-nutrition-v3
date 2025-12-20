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

  return (
    <Dialog
      header=""
      visible={visible}
      style={{
        width: isMobile ? '100%' : '800px',
        maxHeight: '90vh',
        borderRadius: '20px'
      }}
      onHide={onHide}
      position={isMobile ? "bottom" : "center"}
      modal
      dismissableMask
      closable={false}
      className="event-analytics-dialog"
      pt={{
        root: { style: { borderRadius: '20px', overflow: 'hidden' } },
        header: { style: { display: 'none' } },
        content: { style: { padding: 0, borderRadius: '20px', overflow: 'hidden' } }
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e5e7eb',
        padding: '1rem',
        gap: '0.5rem',
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#9ca3af',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem'
            }}>
              ANALYTICS
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.2
            }}>
              Event Analytics
            </div>
          </div>
          <button
            onClick={onHide}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px'
        }}>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            textAlign: 'center',
            margin: 0
          }}>
            Analytics coming soon...
          </p>
        </div>

        {/* Footer Button */}
        <Button
          label="Close"
          icon="pi pi-times"
          onClick={onHide}
          style={{
            backgroundColor: '#1f2937',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.9375rem'
          }}
        />
      </div>
    </Dialog>
  );
};
