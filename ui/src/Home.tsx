import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Nutrients from "./Nutrients";
import CreateFoodItem from "./CreateFoodItem";
import FoodItems from "./FoodItems";
import Events from "./Events";
import { Button } from 'primereact/button';

function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(true);

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
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'stretch', height: 'calc(100% - 4rem)' }}>
              {showCreateForm && (
                <div style={{ flex: '0 0 700px', display: 'flex', flexDirection: 'column' }}>
                  <CreateFoodItem onFoodItemCreated={handleFoodItemCreated} />
                </div>
              )}
              <div style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
                <FoodItems refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        } />
        <Route path="/events" element={<div style={{ maxWidth: '98%', margin: '0 auto', padding: '2rem' }}><Events /></div>} />
        <Route path="/events/:eventId" element={<div style={{ maxWidth: '98%', margin: '0 auto', padding: '2rem' }}><Events /></div>} />
        <Route path="/nutrients" element={<div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem' }}><Nutrients /></div>} />
      </Routes>
    </div>
  );
}

export default Home;