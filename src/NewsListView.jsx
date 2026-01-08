import { useEffect, useState } from "react";
import "./NewsListView.css";

export default function NewsListView({ onBack }) {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtry
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8000/rss");
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

  // filtrowanie
  const filteredNews = newsList.filter((item) => {
    return (
      (!filterSentiment || normalize(item.sentiment_label) === normalize(filterSentiment)) &&
      (!filterRegion || normalize(item.region) === normalize(filterRegion)) &&
      (!filterCategory || normalize(item.category) === normalize(filterCategory))
    );
  });

  // Pobranie unikalnych wartości dla dropdownów
  const sentiments = [...new Set(newsList.map((n) => n.sentiment_label).filter(Boolean))];
  const regions = [...new Set(newsList.map((n) => n.region).filter(Boolean))];
  const categories = [...new Set(newsList.map((n) => n.category).filter(Boolean))];

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack}>Wróć</button>
      <h2>Lista newsów</h2>

      {loading && <p>Ładowanie...</p>}

      <div style={{ marginBottom: 20 }}>
        <label>
          Filtruj po sentymencie:{" "}
          <select value={filterSentiment} onChange={(e) => setFilterSentiment(e.target.value)}>
            <option value="">Wszystkie</option>
            {sentiments.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: 20 }}>
          Filtruj po regionie:{" "}
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            <option value="">Wszystkie</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: 20 }}>
          Filtruj po kategorii:{" "}
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Wszystkie</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <ul>
        {filteredNews.length === 0 && !loading && <li>Brak newsów spełniających kryteria</li>}

        {filteredNews.map((item, i) => (
          <li key={i}>
            <strong>{item.title}</strong>
            <br />
            {item.summary}
            <br />
            Sentiment: {item.sentiment_label} (temperature: {item.temperature})
            <br />
            Region: {item.region || "brak"}
            <br />
            Kategoria: {item.category || "brak"}
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}
