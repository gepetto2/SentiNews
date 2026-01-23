import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import RegionModal from "./components/RegionModal";
import { getColorForTemperature } from "./utils/colors";

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
    const regionData = sentimentData[name.toLowerCase()];
    const temperature = regionData ? regionData.temperature : null;
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

  const selectedData = selectedName
    ? sentimentData[selectedName.toLowerCase()]
    : null;

  const selectedTemp = selectedData ? selectedData.temperature : null;
  const selectedNews = selectedData ? selectedData.news : [];

  return (
    <Box
      sx={{
        height: "100vh",
        position: "relative",
        bgcolor: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* Pastelowe tło mapy (pod kafelkami Leaflet) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(147,197,253,0.35), transparent 60%), radial-gradient(900px 500px at 80% 80%, rgba(253,186,116,0.30), transparent 55%), linear-gradient(180deg, rgba(243,244,246,1) 0%, rgba(249,250,251,1) 100%)",
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
      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          zIndex: 1000,
          borderRadius: 3,
        }}
      >
        <Button
          onClick={onBack}
          variant="outlined"
          size="small"
          sx={{ borderRadius: 3, textTransform: "none" }}
        >
          Wróć
        </Button>
        <Typography variant="subtitle1" fontWeight={500}>
          Mapa nastrojów
        </Typography>
        <Tooltip title="Informacje">
          <IconButton onClick={() => setIsInfoOpen(!isInfoOpen)}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* INFO */}
      {isInfoOpen && (
        <Paper
          sx={{
            position: "absolute",
            top: 76,
            right: 14,
            width: 300,
            p: 2,
            zIndex: 1000,
            borderRadius: 3,
          }}
          elevation={4}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            O SentiNews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kliknij województwo, aby zobaczyć “temperaturę” nastroju.
          </Typography>
        </Paper>
      )}

      {/* MODAL POPUP */}
      <RegionModal
        selectedName={selectedName}
        selectedTemp={selectedTemp}
        selectedNews={selectedNews}
        onClose={() => setSelectedName(null)}
      />
    </Box>
  );
}
