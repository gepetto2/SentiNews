import { Link } from "react-router-dom";

export default function HomeView() {
  return (
    <div className="home">
      <div className="homeCard">
        <div className="brandRow">
          <h1 className="brandTitle">SentiNews</h1>
        </div>

        <div className="actions">
          <Link to="/map">
            <button className="primaryBtn">Mapa</button>
          </Link>
          <Link to="/news">
            <button className="primaryBtn">Lista newsów</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
