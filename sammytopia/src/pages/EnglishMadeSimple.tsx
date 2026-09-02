import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";

export default function EnglishMadeSimple() {
  const [volume, setVolume] = useState<ContentItem | null>(null);
  const [lessons, setLessons] = useState<ContentItem[]>([]);

  useEffect(() => {
    api.get("english-made-simple-volume-1").then(setVolume).catch(() => setVolume(null));
    api.list("ems_lesson", "english-made-simple-volume-1").then(setLessons);
  }, []);

  return (
    <div className="reader-page">
      <div className="reading-column reader-body">
        <p className="chapter-eyebrow">A Sammytopia learning resource</p>
        <h1>ENGLISH MADE SIMPLE</h1>
        <p style={{ fontStyle: "italic", color: "var(--gold-dim)" }}>{volume?.subtitle}</p>

        {volume?.body && (
          <details style={{ margin: "20px 0" }}>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-ui)" }}>Foreword — by Samuel Joshua Jason Pratt</summary>
            <div style={{ marginTop: 12 }}>
              {volume.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </details>
        )}

        <h2>Lessons</h2>
        <div className="feature-list" style={{ borderColor: "var(--paper-line)" }}>
          {lessons.map((l, i) => (
            <Link
              key={l.slug}
              to={`/english-made-simple/${l.slug}`}
              className="feature-row"
              style={{ borderBottom: "1px solid var(--paper-line)" }}
            >
              <div>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--gold-dim)" }}>Lesson {i + 1}</span>
                <div className="feature-title" style={{ color: "var(--ink)" }}>{l.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
