import { useEffect, useState } from "react";

export default function NewsListView({ onBack }) {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8000/rss");
        const data = await res.json();
        setHeadlines(data.headlines);
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
        {headlines.map((item, i) => (
          <li key={i}>
            <strong>{item.title}</strong>
            <br />
            <a href={item.link} target="_blank">
              Link
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
