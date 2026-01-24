import { Routes, Route } from "react-router-dom";
import "./App.css";
import MapView from "./views/MapView.jsx";
import NewsListView from "./views/NewsListView.jsx";
import HomeView from "./views/HomeView.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/map" element={<MapView />} />
      <Route path="/news" element={<NewsListView />} />
    </Routes>
  );
}
