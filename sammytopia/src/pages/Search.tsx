import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ContentItem[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async (value: string) => {
    setQ(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const items = await api.search(value);
    setResults(items);
    setSearched(true);
  };

  return (
    <div className="section">
      <div className="container">
        <h1>Search Sammytopia</h1>
        <input
          type="search"
          value={q}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Search articles, chapters, lessons, and more…"
          style={{ width: "100%", maxWidth: 480, padding: 12, fontFamily: "var(--font-ui)", borderRadius: 3, border: "1px solid rgba(201,162,39,0.4)", background: "transparent", color: "var(--white)" }}
        />
        <div className="feature-list" style={{ marginTop: 24 }}>
          {results.map((r) => (
            <Link key={r.slug} to={`/${r.type === "chapter" ? "joshuana" : "sammy-speaks"}/${r.slug}`} className="feature-row">
              <div>
                <div className="feature-title">{r.title}</div>
                {r.subtitle && <div className="feature-desc">{r.subtitle}</div>}
              </div>
              <span className="feature-meta">{r.type}</span>
            </Link>
          ))}
        </div>
        {searched && results.length === 0 && <p style={{ color: "rgba(253,252,248,0.6)" }}>No results for "{q}".</p>}
      </div>
    </div>
  );
}
