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
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
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
          <div className="food-items-page-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <FoodItems
              refreshTrigger={refreshTrigger}
              onCreateClick={() => setShowCreateDialog(true)}
            />
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
          <div className="food-items-page-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <FoodItems
              refreshTrigger={refreshTrigger}
              onCreateClick={() => setShowCreateDialog(true)}
            />
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
        <Route path="/plans" element={
          <div className="events-route-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '0', padding: '1rem 2rem', display: 'flex', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
              <Button
                icon="pi pi-plus"
                label="Create New Plan"
                onClick={() => setShowCreateEventDialog(true)}
                style={{ backgroundColor: '#6366F1', borderColor: '#6366F1', color: 'white', fontSize: '1rem', padding: '0.75rem 1.5rem' }}
              />
            </div>
            <Events
              showCreateDialog={showCreateEventDialog}
              onHideCreateDialog={() => setShowCreateEventDialog(false)}
            />
          </div>
        } />
        <Route path="/plans/:eventId" element={
          <div className="events-route-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <Events
              showCreateDialog={showCreateEventDialog}
              onHideCreateDialog={() => setShowCreateEventDialog(false)}
            />
          </div>
        } />
        <Route path="/nutrients" element={<div style={{ maxWidth: isMobile ? '100%' : '90%', margin: '0 auto', padding: isMobile ? '0.5rem' : '2rem' }}><Nutrients /></div>} />
        <Route path="/preferences" element={<div className="preferences-wrapper"><Preferences /></div>} />
        <Route path="/users" element={
          <div className="users-route-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <Users />
          </div>
        } />
      </Routes>
    </div>
  );
}

export default Home;