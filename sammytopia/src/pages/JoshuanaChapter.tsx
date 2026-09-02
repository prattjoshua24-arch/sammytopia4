import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";

const FONT_STEPS = [1, 1.1, 1.25, 1.4];

export default function JoshuanaChapter() {
  const { slug } = useParams<{ slug: string }>();
  const [chapter, setChapter] = useState<ContentItem | null>(null);
  const [siblings, setSiblings] = useState<ContentItem[]>([]);
  const [fontStep, setFontStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    api.get(slug).then((c) => {
      setChapter(c);
      localStorage.setItem("joshuana-bookmark", slug);
    });
    api.list("chapter", "the-mystical-kingdom-of-joshuana").then(setSiblings);
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      setProgress(Math.min(1, Math.max(0, scrolled)));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  if (!chapter) {
    return <div className="reader-page reader-body">Loading chapter…</div>;
  }

  const idx = siblings.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const isLast = idx === siblings.length - 1;

  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/joshuana">Table of Contents</Link>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span aria-hidden>Aa</span>
          <button
            aria-label="Decrease text size"
            onClick={() => setFontStep((s) => Math.max(0, s - 1))}
          >
            −
          </button>
          <button
            aria-label="Increase text size"
            onClick={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ height: 3, background: "var(--paper-line)" }}>
        <div style={{ height: 3, width: `${progress * 100}%`, background: "var(--ember)", transition: "width 0.1s linear" }} />
      </div>

      <div ref={bodyRef} className="reading-column reader-body" style={{ fontSize: `${FONT_STEPS[fontStep]}rem` }}>
        <p className="chapter-eyebrow">{chapter.title} of Eight</p>
        <h1>{chapter.subtitle}</h1>
        {chapter.body?.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}

        {isLast && (
          <div style={{ marginTop: 40, textAlign: "center", fontFamily: "var(--font-display)" }}>
            <p style={{ fontSize: "1.4rem" }}>THE END?</p>
            <p style={{ fontStyle: "italic", color: "var(--gold-dim)" }}>
              The kingdom has been renewed.<br />But the story has only begun.
            </p>
          </div>
        )}
      </div>

      <nav className="chapter-nav reading-column" aria-label="Chapter navigation">
        <span>{prev ? <Link to={`/joshuana/${prev.slug}`}>← {prev.title}</Link> : <span />}</span>
        <span>{next ? <Link to={`/joshuana/${next.slug}`}>{next.title} →</Link> : <Link to="/joshuana">Table of Contents</Link>}</span>
      </nav>
    </div>
  );
}
