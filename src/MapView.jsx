import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Funkcja pomocnicza do kolorów
const getColorForTemperature = (temp) => {
  if (temp === undefined || temp === null) return "#e0e0e0";

  if (temp <= -0.5) return "#3b82f6";
  if (temp < -0.1) return "#93c5fd";
  if (temp >= -0.1 && temp <= 0.1) return "#d1d5db";
  if (temp > 0.1 && temp < 0.5) return "#fdba74";
  if (temp >= 0.5) return "#ef4444";

  return "#e0e0e0";
};

export default function MapView({ onBack }) {
  const [geo, setGeo] = useState(null);
  const [sentimentData, setSentimentData] = useState({});
  const [selectedName, setSelectedName] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false); // controls whether the info panel is open

  useEffect(() => {
    fetch("/wojewodztwa.geojson")
      .then((res) => res.json())
      .then((data) => setGeo(data))
      .catch((e) => console.error("fetch error:", e));
  }, []);

  // Pobieranie średnich temperatur nastrojów z backendu
  useEffect(() => {
    fetch("http://localhost:8000/map-data")
      .then((res) => res.json())
      .then((data) => {
        setSentimentData(data);
      })
      .catch((e) => console.error("API fetch error:", e));
  }, []);

  const styleFeature = (feature) => {
    const name = feature.properties.nazwa;

    const temperature = sentimentData[name];
    let fillColor = getColorForTemperature(temperature);

    const isSelected = name === selectedName;

    return {
      fillColor: fillColor,
      weight: isSelected ? 4 : 1,
      color: isSelected ? "#333" : "white",
      zIndex: 1000,
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.nazwa;

    layer.on({
      click: (e) => {
        setSelectedName(name);
        const layer = e.target;
        layer.bringToFront();
      },
    });
  };

  const selectedTemp = selectedName
    ? sentimentData[selectedName.toLowerCase()]
    : null;

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
          flexDirection: "column",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        {selectedName ? `Wybrano: ${selectedName}` : "Kliknij województwo"}
        {selectedName && (
          <div style={{ fontSize: "14px", color: "#555" }}>
            Temperatura:{" "}
            {selectedTemp !== null ? selectedTemp.toFixed(2) : "Brak danych"}
          </div>
        )}
      </div>
    </div>
  );
}
