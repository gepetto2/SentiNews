export default function HomeView({ setScreen }) {
  return (
    <div className="home">
      <div className="homeCard">
        <div className="brandRow">
          <h1 className="brandTitle">SentiNews</h1>
        </div>

        <div className="actions">
          <button className="primaryBtn" onClick={() => setScreen("map")}>
            Mapa
          </button>
          <button className="primaryBtn" onClick={() => setScreen("news")}>
            Lista newsów
          </button>
        </div>
      </div>
    </div>
  );
}
