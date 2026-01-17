import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import chroma from "chroma-js";
import "leaflet/dist/leaflet.css";

const colorScale = chroma.scale(['#dc2626', '#f3f4f6', '#16a34a'])
    .domain([-1, 0, 1]) 
    .mode('lch');

const getColorForTemperature = (temp) => {
  if (temp === undefined || temp === null) return "#e5e7eb";

  return colorScale(temp).hex();
};

export default function MapView({ onBack }) {
  const [geo, setGeo] = useState(null);
  const [sentimentData, setSentimentData] = useState({});
  const [selectedName, setSelectedName] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    fetch("/wojewodztwa.geojson")
      .then((res) => res.json())
      .then((data) => setGeo(data))
      .catch((e) => console.error("fetch error:", e));
  }, []);

  useEffect(() => {
    fetch("https://sentinews.onrender.com/map-data")
      .then((res) => res.json())
      .then((data) => setSentimentData(data))
      .catch((e) => console.error("API fetch error:", e));
  }, []);

  const styleFeature = (feature) => {
    const name = feature.properties.nazwa;
    const temperature = sentimentData[name];
    const fillColor = getColorForTemperature(temperature);
    const isSelected = name === selectedName;

    return {
      fillColor,
      weight: isSelected ? 3 : 1,
      color: isSelected ? "#666" : "white",
      fillOpacity: 0.9,
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.nazwa;

    layer.on({
      click: (e) => {
        setSelectedName(name);
        e.target.bringToFront();
      },
      mouseover: (e) => e.target.setStyle({ weight: 2 }),
      mouseout: (e) =>
        e.target.setStyle({ weight: name === selectedName ? 3 : 1 }),
    });
  };

  const selectedTemp = selectedName
    ? sentimentData[selectedName.toLowerCase()]
    : null;

 
  const cardStyle = {
     borderRadius: "14px",
    background: "#f6f6f6",                 
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    border: "1px solid rgba(0,0,0,0.14)",
    fontWeight: 400,
  };

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        fontWeight: 400,
        background: "#f3f4f6", // pastelowe tło strony (poza samą mapą)
        overflow: "hidden",
      }}
    >
      {/* Pastelowe tło mapy (pod kafelkami Leaflet) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(147,197,253,0.35), transparent 60%), radial-gradient(900px 500px at 80% 80%, rgba(253,186,116,0.30), transparent 55%), linear-gradient(180deg, rgba(243,244,246,1) 0%, rgba(249,250,251,1) 100%)",
          zIndex: 0,
        }}
      />

      <MapContainer
        center={[52, 19]}
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
          background: "transparent",
          zIndex: 1,
        }}
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

      {/* TOP BAR */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          zIndex: 1000,
          fontSize: "16px",
          ...cardStyle,
        }}
      >
        <button
          onClick={onBack}
          style={{
            border: "1px solid rgba(0,0,0,0.14)",
            background: "#e5e7eb",
            borderRadius: "12px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 400,
            fontSize: "16px",
          }}
        >
          Wróć
        </button>

        <div style={{ fontWeight: 400, fontSize: "16px" }}>Mapa nastrojów</div>

        <button
          onClick={() => setIsInfoOpen((prev) => !prev)}
          style={{
            border: "1px solid rgba(0,0,0,0.14)",
            background: "#e5e7eb",
            borderRadius: "12px",
            width: "42px",
            height: "38px",
            cursor: "pointer",
            fontWeight: 400,
            fontSize: "16px",
          }}
          aria-label="Informacje"
          title="Informacje"
        >
          ℹ️
        </button>
      </div>

      {/* INFO */}
      {isInfoOpen && (
        <div
          style={{
            position: "absolute",
            top: 76,
            right: 14,
            width: "360px",
            maxWidth: "calc(100% - 28px)",
            padding: "14px 16px",
            zIndex: 1000,
            fontSize: "14px",
            ...cardStyle,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 400, fontSize: "16px" }}>O SentiNews</div>
            <button
              onClick={() => setIsInfoOpen(false)}
              style={{
                border: "1px solid rgba(0,0,0,0.14)",
                background: "#f6f6f6",
                borderRadius: "12px",
                width: 34,
                height: 34,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                fontWeight: 400,
              }}
              aria-label="Zamknij"
              title="Zamknij"
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: 14, color: "#333", lineHeight: 1.45 }}>
            Kliknij województwo, aby zobaczyć “temperaturę” nastroju.
          </div>
        </div>
      )}

      {/* BOTTOM CARD */}
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          padding: "12px 14px",
          zIndex: 1000,
          textAlign: "center",
          ...cardStyle,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 400 }}>
          {selectedName ? `Wybrano: ${selectedName}` : "Kliknij województwo"}
        </div>

        <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
          {selectedName
            ? `Temperatura: ${
                selectedTemp !== null && selectedTemp !== undefined
                  ? selectedTemp.toFixed(2)
                  : "Brak danych"
              }`
            : "Wybierz region, żeby zobaczyć wynik."}
        </div>
      </div>
    </div>
  );
}
