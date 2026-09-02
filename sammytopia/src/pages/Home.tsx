import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ContentItem } from "../lib/api";
import Intro from "../components/Intro";

const SECTIONS = [
  { to: "/joshuana", title: "The Mystical Kingdom of Joshuana", desc: "An eight-chapter fantasy manuscript — Joshua, the Citadel of Covenant, and the Flame that will not go out." },
  { to: "/love-happens", title: "Love Happens", desc: "A story, and the original screenplay it grew from." },
  { to: "/sammy-speaks", title: "Sammy Speaks", desc: "Essays and articles on faith, growth, and moving forward." },
  { to: "/english-made-simple", title: "English Made Simple", desc: "Volume 1 — a learning resource on the parts of speech." },
  { to: "/zamar", title: "Zamar Worshipers Music Ministry", desc: "Raising a generation of true worshipers." },
  { to: "/baking-and-cooking", title: "Sammy's Baking & Cooking", desc: "Cakes, meals, and creative projects in the kitchen." },
  { to: "/gallery", title: "Gallery", desc: "Photography across every part of Sammytopia." },
  { to: "/about", title: "About Samuel", desc: "Biography, leadership, and the story behind the name." },
];

export default function Home() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [featured, setFeatured] = useState<ContentItem | null>(null);
  const [showIntro, setShowIntro] = useState(
    () => sessionStorage.getItem("sammytopia-intro-seen") !== "1"
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    api.get("joshuana-chapter-1").then(setFeatured).catch(() => setFeatured(null));
  }, []);

  if (showIntro) {
    return <Intro onDone={() => setShowIntro(false)} />;
  }

  return (
    <>
      <div className="hero">
        <p className="eyebrow">A world of ideas awaits</p>
        <h1>SAMMYTOPIA</h1>
        <p className="tagline">No Limits. No Boundaries.</p>
        <p className="subtagline">Building Ideas, Shaping Tomorrow. — ✒ S by Samuel</p>
        {!reduceMotion && <div className="flame-rule" aria-hidden style={{ background: "linear-gradient(90deg, transparent, #c9a227, transparent)", height: 2, width: 80, margin: "24px auto" }} />}
      </div>

      <section className="section divider-top">
        <div className="container">
          <h2>Turn the page</h2>
          <div className="feature-list">
            {SECTIONS.map((s) => (
              <Link key={s.to} to={s.to} className="feature-row">
                <div>
                  <div className="feature-title">{s.title}</div>
                  <div className="feature-desc">{s.desc}</div>
                </div>
                <span className="feature-meta">Enter →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured && (
        <section className="section divider-top">
          <div className="container">
            <h2>Begin reading</h2>
            <p style={{ color: "rgba(253,252,248,0.7)", maxWidth: "60ch" }}>
              Start with Chapter One of <em>The Mystical Kingdom of Joshuana</em> — the day Pratia lost a prince.
            </p>
            <Link to={`/joshuana/${featured.slug}`} style={{ color: "#c9a227", textDecoration: "none", borderBottom: "1px solid #c9a227" }}>
              Read Chapter One →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
