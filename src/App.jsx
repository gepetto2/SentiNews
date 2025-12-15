import { useState } from "react";
import "./App.css";
import MapView from "./MapView.jsx";
import NewsListView from "./NewsListView.jsx";

export default function App() {
  const [screen, setScreen] = useState("home");

  if (screen === "map") {
    return <MapView onBack={() => setScreen("home")} />;
  }

  if (screen === "news") {
    return <NewsListView onBack={() => setScreen("home")} />;
  }

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
