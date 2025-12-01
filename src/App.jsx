import { useState } from "react";
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <h1>SentiNews</h1>
      <button
        onClick={() => setScreen("map")}
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        Mapa
      </button>
      <button
        onClick={() => setScreen("news")}
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        Lista newsów
      </button>
    </div>
  );
}
