import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Pagination,
  Stack,
  Button,
  CircularProgress,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
  Slider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { getColorForTemperature } from "../utils/colors";
import NewsCard from "../components/NewsCard";

export default function NewsListView() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtry
  const [filterTemperature, setFilterTemperature] = useState([-1, 1]);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterCategory, setFilterCategory] = useState([]);

  // Nowe funkcjonalności
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "published",
    direction: "desc",
  });

  // Paginacja
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("https://sentinews.onrender.com/rss");
        const data = await res.json();
        setNewsList(data);
      } catch (e) {
        console.error("RSS error", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtrowanie
  const normalize = (str) => (str ? str.toString().trim().toLowerCase() : "");

  // Resetowanie strony przy zmianie filtrów
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterTemperature,
    filterRegion,
    filterCategory,
    sortConfig,
  ]);

  // Przetwarzanie danych (filtrowanie + sortowanie)
  const processedNews = useMemo(() => {
    // 1. Filtrowanie
    let filtered = newsList.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.title &&
          item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.summary &&
          item.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTemperature =
        item.temperature !== undefined &&
        item.temperature >= filterTemperature[0] &&
        item.temperature <= filterTemperature[1];

      const matchesRegion =
        !filterRegion || normalize(item.region) === normalize(filterRegion);
      const matchesCategory =
        filterCategory.length === 0 || filterCategory.includes(item.category);

      return (
        matchesSearch && matchesTemperature && matchesRegion && matchesCategory
      );
    });

    // 2. Sortowanie
    const { key, direction } = sortConfig;
    if (key) {
      filtered.sort((a, b) => {
        let valA, valB;

        if (key === "temp") {
          valA = Number(a.temperature) || 0;
          valB = Number(b.temperature) || 0;
        } else if (key === "published") {
          valA = new Date(a.published || a.pubDate || 0);
          valB = new Date(b.published || b.pubDate || 0);
        } else {
          return 0; // Nie sortuj dla nieznanego klucza
        }

        if (valA < valB) {
          return direction === "asc" ? -1 : 1;
        }
        if (valA > valB) {
          return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    newsList,
    searchQuery,
    filterTemperature,
    filterRegion,
    filterCategory,
    sortConfig,
  ]);

  // Paginacja - wycinek danych
  const totalPages = Math.ceil(processedNews.length / itemsPerPage);
  const displayedNews = processedNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Pobranie unikalnych wartości dla dropdownów
  const regions = [...new Set(newsList.map((n) => n.region).filter(Boolean))]
    .filter((region) => region !== "Polska")
    .sort();

  const categories = [
    ...new Set(newsList.map((n) => n.category).filter(Boolean)),
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f4f6", py: 3 }}>
      <Container maxWidth="md">
        {/* Top Bar */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            sx={{ bgcolor: "white", borderRadius: 3, textTransform: "none" }}
          >
            Wróć
          </Button>
          <Typography variant="h5" fontWeight={700}>
            Lista newsów
          </Typography>
          <Box width={80} />
        </Stack>

        {/* Controls */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Szukaj"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ minWidth: { sm: 240 } }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel>Sortuj według</InputLabel>
                    <Select
                      value={sortConfig.key}
                      label="Sortuj według"
                      onChange={(e) =>
                        setSortConfig({
                          key: e.target.value,
                          direction: "desc",
                        })
                      }
                    >
                      <MenuItem value="published">Data publikacji</MenuItem>
                      <MenuItem value="temp">Temperatura</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={() =>
                      setSortConfig((prev) => ({
                        ...prev,
                        direction: prev.direction === "asc" ? "desc" : "asc",
                      }))
                    }
                    aria-label="zmień kierunek sortowania"
                  >
                    {sortConfig.direction === "asc" ? (
                      <ArrowUpwardIcon />
                    ) : (
                      <ArrowDownwardIcon />
                    )}
                  </IconButton>
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ width: "100%", px: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Temperatura: {(filterTemperature[0] * 10).toFixed(0)} do{" "}
                    {(filterTemperature[1] * 10).toFixed(0)}
                  </Typography>
                  <Slider
                    size="small"
                    value={filterTemperature}
                    onChange={(e, newValue) => setFilterTemperature(newValue)}
                    valueLabelDisplay="auto"
                    min={-1}
                    max={1}
                    step={0.1}
                    valueLabelFormat={(v) => (v * 10).toFixed(0)}
                    sx={{
                      height: 6,
                      '& .MuiSlider-rail': {
                        background: `linear-gradient(90deg, ${getColorForTemperature(-1)} 0%, ${getColorForTemperature(0)} 50%, ${getColorForTemperature(1)} 100%)`,
                        opacity: 1,
                      },
                      '& .MuiSlider-track': {
                        border: "none",
                        backgroundColor: "rgba(0,0,0,0.1)", // Delikatne wyróżnienie wybranego zakresu
                      },
                      '& .MuiSlider-thumb[data-index="0"]': {
                        backgroundColor: getColorForTemperature(filterTemperature[0]),
                        border: "2px solid #fff",
                      },
                      '& .MuiSlider-thumb[data-index="1"]': {
                        backgroundColor: getColorForTemperature(filterTemperature[1]),
                        border: "2px solid #fff",
                      },
                    }}
                  />
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={filterRegion}
                    label="Region"
                    onChange={(e) => setFilterRegion(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Wszystkie</em>
                    </MenuItem>
                    {regions.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Kategoria</InputLabel>
                  <Select
                    multiple
                    value={filterCategory}
                    onChange={(e) =>
                      setFilterCategory(
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value,
                      )
                    }
                    input={<OutlinedInput label="Kategoria" />}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c} value={c}>
                        <Checkbox checked={filterCategory.indexOf(c) > -1} />
                        <ListItemText primary={c} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        <Stack spacing={2}>
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}

          {!loading && processedNews.length === 0 && (
            <Typography align="center" color="text.secondary" py={4}>
              Brak newsów spełniających kryteria.
            </Typography>
          )}

          {!loading &&
            displayedNews.map((item, i) => {
              return <NewsCard key={i} item={item} />;
            })}
          {!loading && processedNews.length > 0 && (
            <Box display="flex" justifyContent="center" mt={2} pb={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, v) => setCurrentPage(v)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
