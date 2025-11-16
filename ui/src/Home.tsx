import { useAuth0 } from "@auth0/auth0-react";
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
          <>
            <CreateFoodItem />
            <FoodItems />
          </>
        } />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<Events />} />
        <Route path="/nutrients" element={<Nutrients />} />
      </Routes>
    </div>
  );
}

export default Home;