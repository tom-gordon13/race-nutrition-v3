import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { TabMenu } from 'primereact/tabmenu';
import { Menu } from 'primereact/menu';
import { Avatar } from 'primereact/avatar';
import type { MenuItem } from 'primereact/menuitem';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Nav.css';

interface NavProps {
  className?: string;
  pendingConnectionsCount?: number;
  pendingSharedEventsCount?: number;
}

const Nav = ({ className = "", pendingConnectionsCount = 0, pendingSharedEventsCount = 0 }: NavProps) => {
  const { logout, user } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<Menu>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userDivRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // Determine active index based on current path
  const getActiveIndex = () => {
    if (location.pathname.startsWith('/food-items')) return 0;
    if (location.pathname.startsWith('/plans')) return 1;
    if (location.pathname.startsWith('/users')) return 2;
    return -1; // No tab selected for other pages like preferences and nutrients
  };

  const items = [
    {
      label: 'Food Items',
      icon: 'pi pi-apple',
      command: () => navigate('/food-items')
    },
    {
      label: 'Plans',
      icon: 'pi pi-calendar',
      command: () => navigate('/plans'),
      template: (item: any, options: any) => {
        return (
          <a
            className={options.className}
            onClick={(e) => {
              e.preventDefault();
              navigate('/plans');
            }}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <span className="plans-icon-wrapper" style={{ position: 'relative', display: 'inline-flex', overflow: 'visible' }}>
              <span className="p-menuitem-icon pi pi-calendar"></span>
              {pendingSharedEventsCount > 0 && (
                <span className="notification-badge">
                  {pendingSharedEventsCount}
                </span>
              )}
            </span>
            <span className="p-menuitem-text">{item.label}</span>
          </a>
        );
      }
    },
    {
      label: 'Users',
      icon: 'pi pi-users',
      command: () => navigate('/users'),
      template: (item: any, options: any) => {
        return (
          <a
            className={options.className}
            onClick={(e) => {
              e.preventDefault();
              navigate('/users');
            }}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <span className="users-icon-wrapper" style={{ position: 'relative', display: 'inline-flex', overflow: 'visible' }}>
              <span className="p-menuitem-icon pi pi-users"></span>
              {pendingConnectionsCount > 0 && (
                <span className="notification-badge">
                  {pendingConnectionsCount}
                </span>
              )}
            </span>
            <span className="p-menuitem-text">{item.label}</span>
          </a>
        );
      }
    }
  ];

  const userMenuItems: MenuItem[] = [
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        navigate('/preferences');
      }
    },
    {
      separator: true
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => {
        handleSignOut();
      }
    }
  ];

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      // PrimeReact's hide() expects an event object, so we create a mock one
      const mockEvent = {
        currentTarget: userDivRef.current,
        target: userDivRef.current
      } as any;
      menuRef.current?.hide(mockEvent);
      setIsMenuOpen(false);
    }, 150);
  };

  const handleUserMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    clearHideTimeout();
    setIsMenuOpen(true);
    menuRef.current?.show(event);
  };

  const handleUserMouseLeave = () => {
    scheduleHide();
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    // Wait a bit for PrimeReact to render the menu in the DOM
    const timeout = setTimeout(() => {
      const menuElement = document.querySelector('.user-dropdown-menu');

      if (!menuElement) return;

      const handleMenuMouseEnter = () => {
        clearHideTimeout();
      };

      const handleMenuMouseLeave = () => {
        scheduleHide();
      };

      menuElement.addEventListener('mouseenter', handleMenuMouseEnter);
      menuElement.addEventListener('mouseleave', handleMenuMouseLeave);

      return () => {
        menuElement.removeEventListener('mouseenter', handleMenuMouseEnter);
        menuElement.removeEventListener('mouseleave', handleMenuMouseLeave);
      };
    }, 100);

    return () => clearTimeout(timeout);
  }, [isMenuOpen]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className={`nav ${className} ${isMobile ? 'nav-mobile' : ''}`}>
        <div className="nav-content">
          <div className="nav-top-row-wrapper">
            <div className="nav-brand">
              <h2>RaceFuel</h2>
            </div>
            <div className="nav-right">
              <div
                ref={userDivRef}
                className="nav-user"
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <Avatar
                  image={user?.picture}
                  label={!user?.picture ? user?.name?.charAt(0).toUpperCase() : undefined}
                  icon={!user?.picture && !user?.name ? "pi pi-user" : undefined}
                  style={{ backgroundColor: '#F97316', color: 'white', width: '2.5rem', height: '2.5rem' }}
                  shape="circle"
                />
                <span className="user-greeting">Hello, {user?.name}</span>
                <i className="pi pi-chevron-down" style={{ color: '#646cff', fontSize: '0.75rem' }} />
              </div>
              <Menu
                model={userMenuItems}
                popup
                ref={menuRef}
                className="user-dropdown-menu"
              />
            </div>
          </div>
          {!isMobile && (
            <div className="nav-center">
              <TabMenu
                model={items}
                activeIndex={getActiveIndex()}
                className="custom-tabmenu"
              />
            </div>
          )}
        </div>
      </nav>
      {isMobile && (
        <div className="bottom-nav-wrapper">
          <TabMenu
            model={items}
            activeIndex={getActiveIndex()}
            className="custom-tabmenu bottom-tabmenu"
          />
        </div>
      )}
    </>
  );
}

export default Nav;