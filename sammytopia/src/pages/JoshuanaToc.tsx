import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";

export default function JoshuanaToc() {
  const [chapters, setChapters] = useState<ContentItem[]>([]);
  const [bookmark, setBookmark] = useState<string | null>(null);

  useEffect(() => {
    api.list("chapter", "the-mystical-kingdom-of-joshuana").then(setChapters).catch(() => setChapters([]));
    setBookmark(localStorage.getItem("joshuana-bookmark"));
  }, []);

  const stars = Array.from({ length: 40 }, (_, i) => (
    <span
      key={i}
      style={{
        position: "absolute",
        top: `${(i * 37) % 100}%`,
        left: `${(i * 53) % 100}%`,
        width: 2,
        height: 2,
        borderRadius: "50%",
        background: "#fff",
      }}
    />
  ));

  return (
    <div className="joshuana-toc">
      <div className="stars" aria-hidden>{stars}</div>
      <div className="container" style={{ position: "relative", padding: "72px 24px 64px", textAlign: "center" }}>
        <p className="eyebrow" style={{ color: "#c9a227" }}>A Sammytopia Digital Storybook</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}>THE MYSTICAL KINGDOM OF JOSHUANA</h1>
        <div className="flame-rule" />

        {bookmark && (
          <p style={{ marginBottom: 24 }}>
            <Link to={`/joshuana/${bookmark}`} style={{ color: "#c9a227" }}>
              ↳ Continue where you left off
            </Link>
          </p>
        )}

        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "left" }}>
          {chapters.map((c) => (
            <Link
              key={c.slug}
              to={`/joshuana/${c.slug}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 0",
                borderBottom: "1px solid rgba(201,162,39,0.2)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span>
                <span style={{ color: "#c9a227", fontFamily: "var(--font-ui)", fontSize: "0.85rem" }}>{c.title}</span>
                <br />
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>{c.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
