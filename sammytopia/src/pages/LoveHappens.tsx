import { useEffect, useState } from "react";
import { api, ContentItem } from "../lib/api";

export default function LoveHappens() {
  const [tab, setTab] = useState<"story" | "screenplay">("story");
  const [chapters, setChapters] = useState<ContentItem[]>([]);
  const [screenplay, setScreenplay] = useState<ContentItem | null>(null);
  const [activeChapter, setActiveChapter] = useState<ContentItem | null>(null);

  useEffect(() => {
    api.list("chapter", "love-happens").then((c) => {
      setChapters(c);
      setActiveChapter(c[0] ?? null);
    });
    api.get("love-happens-screenplay").then(setScreenplay).catch(() => setScreenplay(null));
  }, []);

  return (
    <div className="reader-page">
      <div className="reading-column reader-body">
        <p className="chapter-eyebrow">Two works, kept separate</p>
        <h1>Love Happens</h1>

        <div style={{ display: "flex", gap: 12, margin: "16px 0 28px", fontFamily: "var(--font-ui)" }}>
          <button
            onClick={() => setTab("story")}
            style={{ fontWeight: tab === "story" ? 700 : 400, borderBottom: tab === "story" ? "2px solid var(--ember)" : "none", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            The Story
          </button>
          <button
            onClick={() => setTab("screenplay")}
            style={{ fontWeight: tab === "screenplay" ? 700 : 400, borderBottom: tab === "screenplay" ? "2px solid var(--ember)" : "none", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            The Original Screenplay
          </button>
        </div>

        {tab === "story" && (
          <div>
            <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {chapters.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setActiveChapter(c)}
                  style={{
                    background: activeChapter?.slug === c.slug ? "var(--gold-dim)" : "transparent",
                    color: activeChapter?.slug === c.slug ? "var(--white)" : "var(--ink)",
                    border: "1px solid var(--paper-line)",
                    borderRadius: 3,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.85rem",
                  }}
                >
                  {c.title}
                </button>
              ))}
            </nav>
            {activeChapter && (
              <div>
                <h2>{activeChapter.subtitle}</h2>
                {activeChapter.body?.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "screenplay" && screenplay && (
          <div style={{ fontFamily: "var(--font-ui)", whiteSpace: "pre-wrap" }}>
            {screenplay.body}
          </div>
        )}
      </div>
    </div>
  );
}
