import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ContentItem, mediaUrl } from "../lib/api";

export default function ContentDetail({ forcedSlug, isZamar }: { forcedSlug?: string; isZamar?: boolean }) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = forcedSlug ?? paramSlug;
  const [item, setItem] = useState<ContentItem | null | "missing">(null);

  useEffect(() => {
    if (!slug) return;
    api.get(slug).then(setItem).catch(() => setItem("missing"));
  }, [slug]);

  if (item === null) return <div className="reader-page reader-body">Loading…</div>;

  if (item === "missing") {
    return (
      <div className="reader-page reader-body reading-column">
        <h1>Not published yet</h1>
        <p>
          {isZamar
            ? "The Zamar Worshipers Music Ministry page is ready for content — add the ministry's story, events, and media from the Admin panel."
            : "This page hasn't been published yet. Add it from the Admin panel."}
        </p>
      </div>
    );
  }

  return (
    <div className="reader-page">
      <div className="reading-column reader-body">
        {item.category && <p className="chapter-eyebrow">{item.category}</p>}
        <h1>{item.title}</h1>
        {item.subtitle && <p style={{ fontStyle: "italic", color: "var(--gold-dim)" }}>{item.subtitle}</p>}

        {item.media && item.media.length > 0 && (
          <div style={{ margin: "20px 0" }}>
            {item.media.map((m) => (
              <figure key={m.id} style={{ margin: "0 0 16px" }}>
                {m.kind === "image" ? (
                  <img src={mediaUrl(m.r2_key)} alt={m.title ?? item.title} />
                ) : (
                  <video src={mediaUrl(m.r2_key)} controls />
                )}
              </figure>
            ))}
          </div>
        )}

        {item.body?.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}

        {item.children && item.children.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2>More</h2>
            {item.children.map((c) => (
              <p key={c.slug}>
                <a href={`${window.location.pathname}/${c.slug}`}>{c.title}</a>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
