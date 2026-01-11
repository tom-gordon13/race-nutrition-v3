import './App.css'
import { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import Nav from './Nav';
import Home from './Home';
import { useUserSync } from './hooks/useUserSync';
import LoadingSpinner from './LoadingSpinner';

const App = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const { isSyncing, syncError } = useUserSync();
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isLoading || isSyncing) {
    return <LoadingSpinner message={isLoading ? 'Loading...' : 'Syncing user...'} />;
  }

  if (syncError) {
    console.error('User sync error:', syncError);
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <>
          {!isFullscreen && <Nav />}
          <main className="main-content">
            <Home onFullscreenChange={setIsFullscreen} />
          </main>
        </>
      ) : (
        <div className="login-container">
          <div className="login-card">
            <h1>RaceFuel</h1>
            <p>Plan your nutrition strategy for optimal race performance</p>
            <button onClick={() =>
              +  loginWithRedirect()} className="login-btn">
              Login to Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
