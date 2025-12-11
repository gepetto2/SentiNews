import { useEffect, useState } from "react";

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
    <div style={{ padding: 20 }}>
      <button onClick={onBack}>Wróć</button>
      <h2>Lista newsów</h2>

      {loading && <p>Ładowanie...</p>}

      <ul>
        {newsList.map((item, i) => (
          <li key={i}>
            <strong>{item.title}</strong>
            <br />
            {item.summary}
            <br />
            Sentiment: {item.sentiment_label.label} (score:{" "}
            {item.sentiment_label.score})
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}
