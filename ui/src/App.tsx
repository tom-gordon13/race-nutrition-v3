import './App.css'
import { useState, useRef } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import Nav from './Nav';
import Home from './Home';
import { useUserSync } from './hooks/useUserSync';
import LoadingSpinner from './LoadingSpinner';

const App = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const { isSyncing, syncError } = useUserSync();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
  const touchStartY = useRef(0);
  const appRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isFullscreen) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0 || isRefreshing || isFullscreen) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing && !isFullscreen) {
      setIsRefreshing(true);
      setPullDistance(60);

      // Trigger refresh
      setRefreshKey(prev => prev + 1);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsRefreshing(false);
      setPullDistance(0);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  if (isLoading || isSyncing) {
    return <LoadingSpinner message={isLoading ? 'Loading...' : 'Syncing user...'} />;
  }

  if (syncError) {
    console.error('User sync error:', syncError);
  }

  return (
    <div
      className="app"
      ref={appRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isAuthenticated ? (
        <>
          {/* Pull to refresh indicator */}
          {!isFullscreen && (
            <div
              className="pull-to-refresh-indicator"
              style={{
                height: `${pullDistance}px`,
                opacity: pullDistance > 0 ? 1 : 0
              }}
            >
              {isRefreshing ? (
                <div className="ptr-spinner">
                  <LoadingSpinner message="" size={30} />
                </div>
              ) : pullDistance > 60 ? (
                <div className="ptr-icon">
                  <i className="pi pi-refresh"></i>
                </div>
              ) : (
                <div className="ptr-icon" style={{ opacity: pullDistance / 60 }}>
                  <i className="pi pi-arrow-down"></i>
                </div>
              )}
            </div>
          )}
          {!isFullscreen && <Nav pendingConnectionsCount={pendingConnectionsCount} />}
          <main className="main-content">
            <Home
              key={refreshKey}
              onFullscreenChange={setIsFullscreen}
              onPendingConnectionsCountChange={setPendingConnectionsCount}
            />
          </main>
        </>
      ) : (
        <div className="login-screen">
          {/* Hero Section with Gradient */}
          <div className="login-hero">
            <h1 className="login-title">RaceFuel</h1>
            <p className="login-subtitle">Plan your nutrition strategy for optimal race performance</p>
          </div>

          {/* Content Card */}
          <div className="login-content">
            {/* Features Section */}
            <div className="login-features">
              <div className="feature-item">
                <div className="feature-icon feature-icon-blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="feature-text">
                  <p className="feature-title">Create Fuel Plans</p>
                  <p className="feature-description">Build nutrition timelines for any event</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon feature-icon-green">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="feature-text">
                  <p className="feature-title">Track Nutrients by Hour</p>
                  <p className="feature-description">Monitor carbs, sodium & calories</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon feature-icon-orange">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="feature-text">
                  <p className="feature-title">Community Plans</p>
                  <p className="feature-description">Share & discover strategies</p>
                </div>
              </div>
            </div>

            {/* Spacer with button */}
            <div className="login-button-section">
              <div className="login-spacer-top"></div>
              <button onClick={() => loginWithRedirect()} className="login-btn">
                Login to Get Started
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <div className="login-spacer-bottom"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
