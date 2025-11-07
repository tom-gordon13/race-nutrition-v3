import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavProps {
  className?: string;
}

const Nav = ({ className = "" }: NavProps) => {
  const { logout, user } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname.startsWith('/events')) return 'events';
    if (location.pathname.startsWith('/nutrients')) return 'nutrients';
    return 'food-items';
  };

  const activeTab = getActiveTab();

  return (
    <nav className={`nav ${className}`}>
      <div className="nav-content">
        <div className="nav-brand">
          <h2>Race Nutrition</h2>
        </div>
        <div className="nav-center">
          <button
            className={`nav-tab ${activeTab === 'food-items' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            Food Items
          </button>
          <button
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => navigate('/events')}
          >
            Events
          </button>
          <button
            className={`nav-tab ${activeTab === 'nutrients' ? 'active' : ''}`}
            onClick={() => navigate('/nutrients')}
          >
            Nutrients
          </button>
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <span className="user-name">Hello, {user?.name}</span>
            <button
              onClick={handleSignOut}
              className="sign-out-btn"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Nav;