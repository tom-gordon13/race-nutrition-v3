import { useAuth0 } from "@auth0/auth0-react";

interface NavProps {
  className?: string;
}

function Nav({ className = "" }: NavProps) {
  const { logout, user } = useAuth0();

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <nav className={`nav ${className}`}>
      <div className="nav-content">
        <div className="nav-brand">
          <h2>Race Nutrition</h2>
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