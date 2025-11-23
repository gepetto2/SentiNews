import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function App() {
  const [geo, setGeo] = useState(null);
  const [selectedName, setSelectedName] = useState(null);

  useEffect(() => {
    fetch("/wojewodztwa.geojson")
      .then((res) => res.json())
      .then((data) => setGeo(data))
      .catch((e) => console.error("fetch error:", e));
  }, []);

  const defaultStyle = {
    fillColor: "#357edd",
    weight: 1,
    color: "white",
    fillOpacity: 0.6,
  };

  const highlightStyle = {
    fillColor: "#ff7f0e",
    weight: 2,
    color: "white",
    fillOpacity: 0.8,
  };

  const styleFeature = (feature) => {
    const name = feature.properties.nazwa;
    return name === selectedName ? highlightStyle : defaultStyle;
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.nazwa;

    layer.on({
      click: () => {
        setSelectedName(name);
      },
    });
  };

  return (
    <div style={{ height: "100vh", background: "#ffffff" }}>
      <MapContainer
        center={[52, 19]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        {geo && (
          <GeoJSON
            data={geo}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}
