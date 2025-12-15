import { useEffect, useState } from "react";
import "./NewsListView.css";

export default function NewsListView({ onBack }) {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="newsPage">
      <div className="newsTopbar uiCard">
        <button onClick={onBack} className="uiBtn">Wróć</button>
        <div className="newsTopTitle">Lista newsów</div>
        <div style={{ width: 74 }} />
      </div>

      <div className="newsList">
        {loading && <div className="uiCard newsItem">Ładowanie...</div>}

        {!loading && newsList.length === 0 && (
          <div className="uiCard newsItem">Brak newsów.</div>
        )}

        {!loading &&
          newsList.map((item, i) => (
            <div key={i} className="uiCard newsItem">
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
                  Temp:{" "}
                  {item.temperature !== undefined && item.temperature !== null
                    ? Number(item.temperature).toFixed(2)
                    : "Brak danych"}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
