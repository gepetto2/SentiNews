import { useState } from "react";
import "./App.css";
import MapView from "./views/MapView.jsx";
import NewsListView from "./views/NewsListView.jsx";
import HomeView from "./views/HomeView.jsx";

export default function App() {
  const [screen, setScreen] = useState("home");

  if (screen === "map") {
    return <MapView onBack={() => setScreen("home")} />;
  }

  if (screen === "news") {
    return <NewsListView onBack={() => setScreen("home")} />;
  }

  return <HomeView setScreen={setScreen} />;
}
