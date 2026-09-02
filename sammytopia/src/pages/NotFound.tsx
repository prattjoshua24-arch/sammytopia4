import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="section">
      <div className="container">
        <h1>This page hasn't been written yet</h1>
        <p style={{ color: "rgba(253,252,248,0.7)" }}>
          Sammytopia is still growing. <Link to="/">Return to the entrance</Link>.
        </p>
      </div>
    </div>
  );
}
