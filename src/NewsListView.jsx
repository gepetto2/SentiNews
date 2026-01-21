import { useEffect, useState, useMemo } from "react";
import chroma from "chroma-js";
import "./NewsListView.css";

const colorScale = chroma.scale(['#dc2626', '#f3f4f6', '#16a34a'])
    .domain([-1, 0, 1]) 
    .mode('lch');

const getColorForTemperature = (temp) => {
  if (temp === undefined || temp === null) return "#e5e7eb";
  return colorScale(temp).hex();
};

// Komponent pomocniczy do wielokrotnego wyboru
const MultiSelect = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "180px", position: "relative" }}>
      <label style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563" }}>{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          fontSize: "14px",
          background: "#fff",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#1f2937",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected.length === 0 ? "Wszystkie" : `Wybrano (${selected.length})`}
        </span>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 20,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginTop: "4px",
              maxHeight: "240px",
              overflowY: "auto",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => toggleOption(opt)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "14px",
                  background: selected.includes(opt) ? "#f3f4f6" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  readOnly
                  style={{ marginRight: "10px", cursor: "pointer" }}
                />
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function NewsListView({ onBack }) {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtry
  const [filterSentiment, setFilterSentiment] = useState([]);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterCategory, setFilterCategory] = useState([]);

  // Nowe funkcjonalności
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("published_desc");
  
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
  }, [searchQuery, filterSentiment, filterRegion, filterCategory, sortBy]);

  // Przetwarzanie danych (filtrowanie + sortowanie)
  const processedNews = useMemo(() => {
    // 1. Filtrowanie
    let filtered = newsList.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSentiment =
        filterSentiment.length === 0 || filterSentiment.includes(item.sentiment_label);
      const matchesRegion =
        !filterRegion || normalize(item.region) === normalize(filterRegion);
      const matchesCategory =
        filterCategory.length === 0 || filterCategory.includes(item.category);

      return matchesSearch && matchesSentiment && matchesRegion && matchesCategory;
    });

    // 2. Sortowanie
    if (sortBy === "temp_desc") {
      filtered.sort((a, b) => (Number(b.temperature) || 0) - (Number(a.temperature) || 0));
    } else if (sortBy === "temp_asc") {
      filtered.sort((a, b) => (Number(a.temperature) || 0) - (Number(b.temperature) || 0));
    } else if (sortBy === "published_desc") {
      filtered.sort((a, b) => new Date(b.published || b.pubDate || 0) - new Date(a.published || a.pubDate || 0));
    } else if (sortBy === "published_asc") {
      filtered.sort((a, b) => new Date(a.published || a.pubDate || 0) - new Date(b.published || b.pubDate || 0));
    }
    // "default" zostawiamy bez zmian (kolejność z API)

    return filtered;
  }, [newsList, searchQuery, filterSentiment, filterRegion, filterCategory, sortBy]);

  // Paginacja - wycinek danych
  const totalPages = Math.ceil(processedNews.length / itemsPerPage);
  const displayedNews = processedNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pobranie unikalnych wartości dla dropdownów
  const sentiments = [...new Set(newsList.map((n) => n.sentiment_label).filter(Boolean))];
  const regions = [...new Set(newsList.map((n) => n.region).filter(Boolean))];
  const categories = [...new Set(newsList.map((n) => n.category).filter(Boolean))];

  // Style
  const containerStyle = {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "20px",
    fontFamily: "sans-serif",
    color: "#1f2937",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb",
  };

  const controlGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    minWidth: "180px",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4b5563",
  };

  const inputStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
    marginRight: "8px",
    marginBottom: "4px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
  };

  const paginationBtnStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div style={containerStyle}>
      {/* Top Bar */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "#e5e7eb",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            color: "#374151"
          }}
        >
          ← Wróć
        </button>
        <div style={{ fontSize: "20px", fontWeight: "700" }}>Lista newsów</div>
        <div style={{ width: "64px" }} />
      </div>

      {/* Controls */}
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Search & Sort */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <div style={controlGroupStyle}>
            <label style={labelStyle}>Szukaj</label>
            <input
              type="text"
              placeholder="Tytuł lub treść..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={controlGroupStyle}>
            <label style={labelStyle}>Sortowanie</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={inputStyle}
            >
              <option value="published_desc">Data publikacji (od najnowszych)</option>
              <option value="published_asc">Data publikacji (od najstarszych)</option>
              <option value="temp_desc">Temperatura (od najwyższej)</option>
              <option value="temp_asc">Temperatura (od najniższej)</option>
            </select>
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #f3f4f6", width: "100%", margin: 0 }} />

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <MultiSelect
            label="Sentyment"
            options={sentiments}
            selected={filterSentiment}
            onChange={setFilterSentiment}
          />

          <div style={controlGroupStyle}>
            <label style={labelStyle}>Region</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              style={inputStyle}
            >
              <option value="">Wszystkie</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <MultiSelect
            label="Kategoria"
            options={categories}
            selected={filterCategory}
            onChange={setFilterCategory}
          />
        </div>
      </div>

      {/* List */}
      <div>
        {loading && <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>Ładowanie...</div>}

        {!loading && processedNews.length === 0 && (
          <div style={{ ...cardStyle, textAlign: "center", color: "#6b7280" }}>Brak newsów spełniających kryteria.</div>
        )}

        {!loading &&
          displayedNews.map((item, i) => {
            const tempColor = getColorForTemperature(item.temperature);
            return (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div
                  style={{ ...cardStyle, transition: "transform 0.2s", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>
                    {item.title}
                  </div>

                  <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "12px", lineHeight: "1.5" }}>
                    {item.summary}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {item.sentiment_label && (
                      <span style={{ ...pillStyle, background: "#e0f2fe", color: "#0369a1" }}>
                        {item.sentiment_label}
                      </span>
                    )}
                    {item.region && (
                      <span style={{ ...pillStyle }}>
                        📍 {item.region}
                      </span>
                    )}
                    {item.category && (
                      <span style={{ ...pillStyle, background: "#fce7f3", color: "#be185d" }}>
                        {item.category}
                      </span>
                    )}
                    <span style={{ ...pillStyle, background: tempColor, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                      Temp: {item.temperature !== undefined && item.temperature !== null ? Number(item.temperature).toFixed(2) : "-"}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}

        {/* Pagination Controls */}
        {!loading && processedNews.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "20px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                ...paginationBtnStyle,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? "default" : "pointer",
              }}
            >
              Poprzednia
            </button>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#4b5563" }}>
              Strona {currentPage} z {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                ...paginationBtnStyle,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? "default" : "pointer",
              }}
            >
              Następna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
