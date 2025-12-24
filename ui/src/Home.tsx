import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import Nutrients from "./Nutrients";
import FoodItems from "./FoodItems";
import Events from "./Events";
import Preferences from "./Preferences";
import Users from "./Users";
import { Button } from 'primereact/button';
import { CreateFoodItemDialog } from './components/food-items/CreateFoodItemDialog';
import './Home.css';

function Home() {
  const { user } = useAuth0();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
                onClick={() => setShowCreateDialog(true)}
                severity="secondary"
                outlined
              />
            </div>
            <FoodItems refreshTrigger={refreshTrigger} />
            {user?.sub && (
              <CreateFoodItemDialog
                visible={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                onCreate={handleFoodItemCreated}
                auth0Sub={user.sub}
              />
            )}
          </div>
        } />
        <Route path="/food-items/:id" element={
          <div className="food-items-page-container" style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Button
                icon="pi pi-plus"
                label="Create New Item"
                onClick={() => setShowCreateDialog(true)}
                severity="secondary"
                outlined
              />
            </div>
            <FoodItems refreshTrigger={refreshTrigger} />
            {user?.sub && (
              <CreateFoodItemDialog
                visible={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                onCreate={handleFoodItemCreated}
                auth0Sub={user.sub}
              />
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