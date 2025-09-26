import './App.css'
import { useAuth0 } from "@auth0/auth0-react";
import Nav from './Nav';
import Home from './Home';

const App = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <>
          <Nav />
          <main className="main-content">
            <Home />
          </main>
        </>
      ) : (
        <div className="login-container">
          <div className="login-card">
            <h1>Race Nutrition</h1>
            <p>Plan your nutrition strategy for optimal race performance</p>
            <button onClick={loginWithRedirect} className="login-btn">
              Login to Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
