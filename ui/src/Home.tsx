import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Nutrients from "./Nutrients";
import CreateFoodItem from "./CreateFoodItem";
import FoodItems from "./FoodItems";
import Events from "./Events";
import Preferences from "./Preferences";
import { Button } from 'primereact/button';

function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleFoodItemCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="home">
      <Routes>
        <Route path="/" element={<Navigate to="/food-items" replace />} />
        <Route path="/food-items" element={
          <div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Button
                icon={showCreateForm ? "pi pi-eye-slash" : "pi pi-eye"}
                label={showCreateForm ? "Hide Create Form" : "Show Create Form"}
                onClick={() => setShowCreateForm(!showCreateForm)}
                severity="secondary"
                outlined
              />
            </div>
            <div style={{ display: 'flex', gap: showCreateForm ? '2rem' : '0', alignItems: 'stretch', height: 'calc(100% - 4rem)', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: showCreateForm ? 'relative' : 'absolute',
                  left: showCreateForm ? '0' : '-720px',
                  width: '700px',
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
          </div>
        } />
        <Route path="/events" element={<div className="events-route-container"><Events /></div>} />
        <Route path="/events/:eventId" element={<div className="events-route-container"><Events /></div>} />
        <Route path="/nutrients" element={<div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem' }}><Nutrients /></div>} />
        <Route path="/preferences" element={<div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem' }}><Preferences /></div>} />
      </Routes>
    </div>
  );
}

export default Home;