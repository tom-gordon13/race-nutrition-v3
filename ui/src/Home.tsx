import { Routes, Route } from "react-router-dom";
import Nutrients from "./Nutrients";
import CreateFoodItem from "./CreateFoodItem";
import FoodItems from "./FoodItems";
import Events from "./Events";

function Home() {

  return (
    <div className="home">
      <Routes>
        <Route path="/" element={
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 700px' }}>
              <CreateFoodItem />
            </div>
            <div style={{ flex: '1', minWidth: '0' }}>
              <FoodItems />
            </div>
          </div>
        } />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<Events />} />
        <Route path="/nutrients" element={<Nutrients />} />
      </Routes>
    </div>
  );
}

export default Home;