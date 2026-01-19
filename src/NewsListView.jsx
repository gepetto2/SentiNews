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
    <div className="newsPage">
      <div className="newsTopbar uiCard">
        <button onClick={onBack} className="uiBtn">Wróć</button>
        <div className="newsTopTitle">Lista newsów</div>
        <div style={{ width: 74 }} />
      </div>

      <div className="newsTopbar uiCard" style={{ marginTop: 10, flexDirection: "column", height: "auto" }}>
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

      <div className="newsList">
        {loading && <div className="uiCard newsItem">Ładowanie...</div>}

        {!loading && newsList.length === 0 && (
          <div className="uiCard newsItem">Brak newsów.</div>
        )}

        {!loading &&
          filteredNews.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="uiCard newsItem">
                <div className="newsTitleRow">
                  <div className="newsTitle">{item.title}</div>
                </div>

                <div className="newsSummary">{item.summary}</div>

                {/* TYLKO PO LEWEJ (jak było): Sentiment + Temp */}
                <div className="newsMetaRow">
                  <span className="uiPill">
                    Sentiment: {item.sentiment_label ?? "Brak"}
                  </span>

                  <span className="uiPill">
                    Region: {item.region ?? "Brak"}
                  </span>

                  <span className="uiPill">
                    Kategoria: {item.category ?? "Brak"}
                  </span>

                  <span className="uiPill">
                    Temp:{" "}
                    {item.temperature !== undefined && item.temperature !== null
                      ? Number(item.temperature).toFixed(2)
                      : "Brak danych"}
                  </span>
                </div>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
