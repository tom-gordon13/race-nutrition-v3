import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import { TabMenu } from 'primereact/tabmenu';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Nav.css';

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

  // Determine active index based on current path
  const getActiveIndex = () => {
    if (location.pathname.startsWith('/food-items')) return 0;
    if (location.pathname.startsWith('/events')) return 1;
    if (location.pathname.startsWith('/nutrients')) return 2;
    return 0;
  };

  const items = [
    {
      label: 'Food Items',
      icon: 'pi pi-apple',
      command: () => navigate('/food-items')
    },
    {
      label: 'Events',
      icon: 'pi pi-calendar',
      command: () => navigate('/events')
    },
    {
      label: 'Nutrients',
      icon: 'pi pi-chart-bar',
      command: () => navigate('/nutrients')
    }
  ];

  return (
    <nav className={`nav ${className}`} style={{ backgroundColor: '#f3f0ff', borderBottom: '1px solid #e5e7eb', padding: '0.75rem 0', width: '100%' }}>
      <div className="nav-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', maxWidth: '100%', margin: '0 auto' }}>
        <div className="nav-brand" style={{ marginRight: '2rem' }}>
          <h2 style={{ margin: 0, color: '#646cff', fontSize: '1.5rem', fontWeight: 700 }}>Race Nutrition</h2>
        </div>
        <div className="nav-center" style={{ flex: 1 }}>
          <TabMenu
            model={items}
            activeIndex={getActiveIndex()}
            className="custom-tabmenu"
          />
        </div>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar
              label={user?.name?.charAt(0).toUpperCase()}
              icon="pi pi-user"
              style={{ backgroundColor: '#646cff', color: 'white' }}
              shape="circle"
            />
            <span style={{ color: '#646cff', fontWeight: 500 }}>Hello, {user?.name}</span>
            <Button
              onClick={handleSignOut}
              label="Sign Out"
              icon="pi pi-sign-out"
              severity="secondary"
              outlined
              size="small"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Nav;