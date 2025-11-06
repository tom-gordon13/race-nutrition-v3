import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Nutrients from "./Nutrients";
import CreateFoodItem from "./CreateFoodItem";
import FoodItems from "./FoodItems";
import Events from "./Events";

type Tab = 'food-items' | 'events' | 'nutrients';

function Home() {
  const { user } = useAuth0();
  const [activeTab, setActiveTab] = useState<Tab>('food-items');

  return (
    <div className="home">

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'food-items' ? 'active' : ''}`}
          onClick={() => setActiveTab('food-items')}
        >
          Food Items
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          className={`tab ${activeTab === 'nutrients' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrients')}
        >
          Nutrients
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'food-items' && (
          <>
            <CreateFoodItem />
            <FoodItems />
          </>
        )}

        {activeTab === 'events' && <Events />}

        {activeTab === 'nutrients' && <Nutrients />}
      </div>
    </div>
  );
}

export default Home;