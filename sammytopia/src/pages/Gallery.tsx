import { useEffect, useState } from "react";
import { api, MediaItem, mediaUrl } from "../lib/api";

const CATEGORIES = ["all", "wilberforce", "sammytopia", "school", "zamar", "baking", "about", "creative-work"];

export default function Gallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.media(filter === "all" ? undefined : filter).then(setItems);
  }, [filter]);

  return (
    <div className="section">
      <div className="container">
        <h1>Gallery</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, fontFamily: "var(--font-ui)", fontSize: "0.85rem" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                background: filter === c ? "var(--gold)" : "transparent",
                color: filter === c ? "var(--ink)" : "var(--white)",
                border: "1px solid rgba(201,162,39,0.4)",
                borderRadius: 3,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              {c.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="gallery-grid">
          {items.map((m) => (
            <a key={m.id} href={mediaUrl(m.r2_key)} target="_blank" rel="noreferrer">
              {m.kind === "image" ? (
                <img src={mediaUrl(m.r2_key)} alt={m.title ?? ""} loading="lazy" />
              ) : (
                <video src={mediaUrl(m.r2_key)} muted />
              )}
            </a>
          ))}
        </div>
        {items.length === 0 && <p style={{ color: "rgba(253,252,248,0.6)" }}>No media in this category yet.</p>}
      </div>
    </div>
  );
}
