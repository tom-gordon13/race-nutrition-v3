import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import Nutrients from "./Nutrients";
import FoodItems from "./FoodItems";
import Events from "./Events";
import Plans from "./Plans";
import Preferences from "./Preferences";
import Users from "./Users";
import { CreateFoodItemDialog } from './components/food-items/CreateFoodItemDialog';
import './Home.css';

interface HomeProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

function Home({ onFullscreenChange }: HomeProps) {
  const { user } = useAuth0();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);

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
          <div className="plans-route-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <Plans />
          </div>
        } />
        <Route path="/plans/:eventId" element={
          <div className="events-route-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <Events
              showCreateDialog={showCreateEventDialog}
              onHideCreateDialog={() => setShowCreateEventDialog(false)}
              onFullscreenChange={onFullscreenChange}
            />
          </div>
        } />
        <Route path="/nutrients" element={
          <div className="nutrients-route-container" style={{ width: '100%', margin: '0', padding: '0', height: '100%', boxSizing: 'border-box' }}>
            <Nutrients />
          </div>
        } />
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