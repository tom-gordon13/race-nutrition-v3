import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Nutrients from "./Nutrients";
import CreateFoodItem from "./CreateFoodItem";
import FoodItems from "./FoodItems";
import Events from "./Events";
import Preferences from "./Preferences";
import Users from "./Users";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import './Home.css';

function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFoodItemCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowCreateForm(false);
  };

  return (
    <div className="home">
      <Routes>
        <Route path="/" element={<Navigate to="/food-items" replace />} />
        <Route path="/food-items" element={
          <div className="food-items-page-container" style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Button
                icon="pi pi-plus"
                label="Create New Item"
                onClick={() => setShowCreateForm(!showCreateForm)}
                severity="secondary"
                outlined
              />
            </div>
            {isMobile ? (
              <>
                <Dialog
                  header="Create New Item"
                  visible={showCreateForm}
                  className="create-food-item-dialog"
                  style={{ width: '100vw', height: '85vh' }}
                  onHide={() => setShowCreateForm(false)}
                  position="bottom"
                  modal
                  dismissableMask
                >
                  <CreateFoodItem onFoodItemCreated={handleFoodItemCreated} />
                </Dialog>
                <FoodItems refreshTrigger={refreshTrigger} />
              </>
            ) : (
              <div style={{ display: 'flex', gap: showCreateForm ? '2rem' : '0', alignItems: 'stretch', height: 'calc(100% - 4rem)', position: 'relative', overflow: 'hidden' }}>
                <div
                  style={{
                    position: showCreateForm ? 'relative' : 'absolute',
                    left: showCreateForm ? '0' : '-35%',
                    width: '30%',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: showCreateForm ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, left 0.3s ease-in-out',
                    opacity: showCreateForm ? 1 : 0,
                    zIndex: showCreateForm ? 1 : -1,
                  }}
                >
                  <CreateFoodItem onFoodItemCreated={handleFoodItemCreated} />
                </div>
                <div style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', marginLeft: showCreateForm ? '0' : '0', transition: 'margin-left 0.3s ease-in-out' }}>
                  <FoodItems refreshTrigger={refreshTrigger} />
                </div>
              </div>
            )}
          </div>
        } />
        <Route path="/events" element={<div className="events-route-container"><Events /></div>} />
        <Route path="/events/:eventId" element={<div className="events-route-container"><Events /></div>} />
        <Route path="/nutrients" element={<div style={{ maxWidth: isMobile ? '100%' : '90%', margin: '0 auto', padding: isMobile ? '0.5rem' : '2rem' }}><Nutrients /></div>} />
        <Route path="/preferences" element={<div className="preferences-wrapper"><Preferences /></div>} />
        <Route path="/users" element={<div className="users-route-container"><Users /></div>} />
      </Routes>
    </div>
  );
}

export default Home;