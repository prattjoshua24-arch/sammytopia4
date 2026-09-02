import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";

export default function ContentList({ type, title, basePath }: { type: string; title: string; basePath?: string }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.list(type).then((r) => {
      setItems(r);
      setLoaded(true);
    });
  }, [type]);

  const base = basePath ?? window.location.pathname.replace(/\/$/, "");

  return (
    <div className="section">
      <div className="container">
        <h1>{title}</h1>
        {loaded && items.length === 0 && (
          <p style={{ color: "rgba(253,252,248,0.6)" }}>
            Nothing published here yet — check back soon, or add the first post from the Admin panel.
          </p>
        )}
        <div className="feature-list">
          {items.map((item) => (
            <Link key={item.slug} to={`${base}/${item.slug}`} className="feature-row">
              <div>
                <div className="feature-title">{item.title}</div>
                {item.subtitle && <div className="feature-desc">{item.subtitle}</div>}
              </div>
              {item.category && <span className="feature-meta">{item.category}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
