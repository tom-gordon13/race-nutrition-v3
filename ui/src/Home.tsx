import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Nutrients from "./Nutrients";
import CreateFoodItem from "./CreateFoodItem";
import FoodItems from "./FoodItems";
import Events from "./Events";

function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFoodItemCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="home">
      <Routes>
        <Route path="/food-items" element={
          <div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'stretch', height: '100%' }}>
              <div style={{ flex: '0 0 700px', display: 'flex', flexDirection: 'column' }}>
                <CreateFoodItem onFoodItemCreated={handleFoodItemCreated} />
              </div>
              <div style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
                <FoodItems refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        } />
        <Route path="/events" element={<div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem' }}><Events /></div>} />
        <Route path="/events/:eventId" element={<div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem' }}><Events /></div>} />
        <Route path="/nutrients" element={<div style={{ maxWidth: '90%', margin: '0 auto', padding: '2rem' }}><Nutrients /></div>} />
      </Routes>
    </div>
  );
}

export default Home;