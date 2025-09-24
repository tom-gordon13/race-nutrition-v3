import { useAuth0 } from "@auth0/auth0-react";

function Home() {
  const { user } = useAuth0();

  return (
    <div className="home">
      <div className="home-content">
        <section className="welcome-section">
          <h1>Welcome to Race Nutrition</h1>
          <p>Plan and track your nutrition strategy for optimal race performance.</p>
        </section>

        <section className="dashboard">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>My Nutrition Plans</h3>
              <p>Create and manage your race nutrition strategies</p>
              <button className="btn-primary">View Plans</button>
            </div>

            <div className="dashboard-card">
              <h3>Race Calendar</h3>
              <p>Track your upcoming races and nutrition preparation</p>
              <button className="btn-primary">View Calendar</button>
            </div>

            <div className="dashboard-card">
              <h3>Nutrition Log</h3>
              <p>Log and analyze your race day nutrition performance</p>
              <button className="btn-primary">View Log</button>
            </div>

            <div className="dashboard-card">
              <h3>Profile Settings</h3>
              <p>Manage your personal nutrition preferences and goals</p>
              <button className="btn-primary">Edit Profile</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;