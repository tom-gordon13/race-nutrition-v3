import { useAuth0 } from "@auth0/auth0-react";

function Home() {
  const { user } = useAuth0();

  return (
    <div className="home">
    </div>
  );
}

export default Home;