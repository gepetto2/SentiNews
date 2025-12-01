import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ onBack }) {
  const [geo, setGeo] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false); // controls whether the info panel is open

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
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button onClick={onBack} style={{ padding: "5px 10px" }}>
        Wróć
      </button>
      <div style={{ flex: "1 1 auto", position: "relative" }}>
        {/*  added onClick and userSelect */}
        <div
          onClick={() => setIsInfoOpen((prev) => !prev)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            padding: "10px 14px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            cursor: "pointer",
            zIndex: 1000,
            userSelect: "none",
          }}
        >
          ℹ️
        </div>

        {/*information panel with the application description */}
        {isInfoOpen && (
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 20,
              width: "320px",
              background: "white",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              padding: "14px 16px",
              zIndex: 900,
              fontSize: "14px",
              lineHeight: "1.4",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: "8px",
                fontSize: "18px",
              }}
            >
              O aplikacji SentiNews
            </h2>
            <p style={{ margin: 0, marginBottom: "6px" }}>
              Aplikacja analizująca nastrój lokalnych wiadomości i postów w
              wybranym województwie.
            </p>
            <p style={{ margin: 0, marginBottom: "6px" }}>
              Pobiera nagłówki (oraz ewentualnie skróty) newsów lub wpisy z
              Twittera/Reddita/Facebooka po polsku.
            </p>
            <p style={{ margin: 0, marginBottom: "6px" }}>
              Analizuje nastroje (pozytywny/negatywny/neutralny, lub dokładniej
              np. w określonej skali w stopniach).
            </p>
            <p style={{ margin: 0, marginBottom: "6px" }}>
              Wizualizuje zmianę nastroju w czasie lub różnice między regionami
              albo źródłami wpisów/newsów.
            </p>
            <p style={{ margin: 0 }}>
              Umożliwia analizę &quot;temperatury emocjonalnej&quot; regionu lub
              całego kraju.
            </p>
          </div>
        )}

        <MapContainer
          center={[52, 19]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
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

      <div
        style={{
          height: "60px",
          background: "#f0f0f0",
          borderTop: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        {selectedName ? `Wybrano: ${selectedName}` : "Kliknij województwo"}
      </div>
    </div>
  );
}
