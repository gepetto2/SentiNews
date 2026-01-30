import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import chroma from "chroma-js";
import {
  MapContainer,
  GeoJSON,
  CircleMarker,
  Popup,
  Pane,
} from "react-leaflet";
import { createLayerComponent } from "@react-leaflet/core";
import MarkerClusterGroup from "react-leaflet-cluster";
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RegionModal from "../components/RegionModal";
import { getColorForTemperature } from "../utils/colors";

const VectorTileLayer = createLayerComponent((props, context) => {
  const instance = L.maplibreGL({
    style: props.url,
    attribution: props.attribution,
    pane: props.pane || "tilePane",
  });
  return { instance, context };
});

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

export default function MapView() {
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
      fillOpacity: 1,
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

  const createClusterIcon = (cluster) => {
    const markers = cluster.getAllChildMarkers();
    let sumSentiment = 0;
    let count = 0;

    markers.forEach((marker) => {
      const sentiment = marker.options.sentiment;
      if (sentiment !== undefined && sentiment !== null) {
        sumSentiment += sentiment;
        count++;
      }
    });

    const avgSentiment = count > 0 ? sumSentiment / count : 0;
    const color = getColorForTemperature(avgSentiment);
    const textColor = chroma(color).luminance() > 0.4 ? "#000" : "#fff";

    return L.divIcon({
      html: `<div style="background-color: ${color}; color: ${textColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #444; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "custom-marker-cluster",
      iconSize: L.point(36, 36),
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
        height: ["100vh", "100dvh"],
        position: "relative",
        bgcolor: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[52, 19]}
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
          background: "#f3f4f6",
          zIndex: 1,
        }}
        zoomControl={false}
        attributionControl={false}
        minZoom={6}
        maxZoom={10}
        maxBounds={[
          [46, 4], // [południe, zachód]
          [57, 33], // [północ, wschód]
        ]}
      >
        <VectorTileLayer
          attribution='&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
          url={`https://api.maptiler.com/maps/019c0cbe-faa0-7d23-af0b-548412706113/style.json?key=${MAPTILER_KEY}`}
        />
        {geo && (
          <GeoJSON
            data={geo}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {Object.values(sentimentData).flatMap((region) =>
            region.news
              .filter((n) => n.lat !== null && n.lon !== null)
              .map((news, idx) => (
                <CircleMarker
                  key={`${news.link}-${idx}`}
                  center={[news.lat, news.lon]}
                  sentiment={news.temperature}
                  radius={8}
                  pathOptions={{
                    fillColor: getColorForTemperature(news.temperature),
                    color: "#444",
                    weight: 2,
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.5 }}
                    >
                      {news.domain} •{" "}
                      {news.published
                        ? new Date(news.published).toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Brak daty"}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ mb: 1 }}
                    >
                      {news.title}
                    </Typography>
                    <Button
                      href={news.link}
                      target="_blank"
                      size="small"
                      sx={{ textTransform: "none", p: 0 }}
                    >
                      Czytaj więcej
                    </Button>
                  </Popup>
                </CircleMarker>
              )),
          )}
        </MarkerClusterGroup>

        {/* Pane z etykietami na samym końcu, aby był nad klastrami */}
        <Pane name="labels" style={{ zIndex: 650, pointerEvents: "none" }}>
          <VectorTileLayer
            attribution='&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
            url={`https://api.maptiler.com/maps/019c0ca7-f81a-7be8-8124-aa9e56706bc7/style.json?key=${MAPTILER_KEY}`}
            pane="labels"
          />
        </Pane>
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
          component={Link}
          to="/"
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{
            bgcolor: "white",
            borderRadius: 3,
            textTransform: "none",
          }}
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

      {/* LEGENDA */}
      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          bottom: { xs: 80, sm: 24 },
          right: 14,
          p: 1.5,
          zIndex: 1000,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "center",
        }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Nastroje
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, height: 150, py: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: "100%",
              borderRadius: 1,
              background: `linear-gradient(0deg, ${getColorForTemperature(-1)} 0%, ${getColorForTemperature(0)} 50%, ${getColorForTemperature(1)} 100%)`,
            }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
            >
              10
            </Typography>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
            >
              0
            </Typography>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
            >
              -10
            </Typography>
          </Box>
        </Box>
      </Paper>

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
