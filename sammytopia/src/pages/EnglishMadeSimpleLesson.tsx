import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";

export default function EnglishMadeSimpleLesson() {
  const { slug } = useParams<{ slug: string }>();
  const [lesson, setLesson] = useState<ContentItem | null>(null);
  const [siblings, setSiblings] = useState<ContentItem[]>([]);

  useEffect(() => {
    if (!slug) return;
    api.get(slug).then(setLesson);
    api.list("ems_lesson", "english-made-simple-volume-1").then(setSiblings);
  }, [slug]);

  if (!lesson) return <div className="reader-page reader-body">Loading…</div>;

  const idx = siblings.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="reader-page">
      <div className="reading-column reader-body">
        <p className="chapter-eyebrow"><Link to="/english-made-simple">English Made Simple, Volume 1</Link></p>
        <h1>{lesson.title}</h1>
        {lesson.body?.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <nav className="chapter-nav reading-column">
        <span>{prev ? <Link to={`/english-made-simple/${prev.slug}`}>← {prev.title}</Link> : <span />}</span>
        <span>{next ? <Link to={`/english-made-simple/${next.slug}`}>{next.title} →</Link> : <Link to="/english-made-simple">All lessons</Link>}</span>
      </nav>
    </div>
  );
}
