export default function NewsListView({ onBack }) {
  const headlines = [
    "Przykładowy nagłówek 1",
    "Przykładowy nagłówek 2",
    "Przykładowy nagłówek 3",
  ];

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 10 }}>
        Wróć
      </button>
      <h2>Lista newsów</h2>
      <ul>
        {headlines.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  );
}
