import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import JoshuanaToc from "./pages/JoshuanaToc";
import JoshuanaChapter from "./pages/JoshuanaChapter";
import ContentList from "./pages/ContentList";
import ContentDetail from "./pages/ContentDetail";
import LoveHappens from "./pages/LoveHappens";
import EnglishMadeSimple from "./pages/EnglishMadeSimple";
import EnglishMadeSimpleLesson from "./pages/EnglishMadeSimpleLesson";
import Gallery from "./pages/Gallery";
import Search from "./pages/Search";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="site-header">
        <nav aria-label="Primary">
          <Link to="/" className="wordmark">SAMMYTOPIA</Link>
          <div className="nav-links">
            <Link to="/joshuana">Joshuana</Link>
            <Link to="/love-happens">Love Happens</Link>
            <Link to="/sammy-speaks">Sammy Speaks</Link>
            <Link to="/english-made-simple">English Made Simple</Link>
            <Link to="/zamar">Zamar Worshipers</Link>
            <Link to="/baking-and-cooking">Baking &amp; Cooking</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/about">About Samuel</Link>
            <Link to="/search">Search</Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/joshuana" element={<JoshuanaToc />} />
          <Route path="/joshuana/:slug" element={<JoshuanaChapter />} />

          <Route path="/love-happens" element={<LoveHappens />} />

          <Route path="/sammy-speaks" element={<ContentList type="article" title="Sammy Speaks" />} />
          <Route path="/sammy-speaks/:slug" element={<ContentDetail />} />

          <Route path="/english-made-simple" element={<EnglishMadeSimple />} />
          <Route path="/english-made-simple/:slug" element={<EnglishMadeSimpleLesson />} />

          <Route path="/zamar" element={<ContentDetail forcedSlug="zamar-worshipers-music-ministry" isZamar />} />

          <Route path="/baking-and-cooking" element={<ContentList type="baking_post" title="Sammy's Baking &amp; Cooking" />} />
          <Route path="/baking-and-cooking/:slug" element={<ContentDetail />} />

          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<ContentDetail forcedSlug="about-samuel" />} />
          <Route path="/search" element={<Search />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>SAMMYTOPIA — No Limits. No Boundaries. Building Ideas, Shaping Tomorrow.</p>
        <p>✒ S by Samuel</p>
      </footer>
    </>
  );
}
