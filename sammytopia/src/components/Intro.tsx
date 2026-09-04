import { useEffect, useRef, useState } from "react";

// The Sammytopia intro. A required "tap to begin" gate (needed to unlock
// audio in the browser) is followed by the full non-skippable cinematic
// sequence: first light, particles, star, butterflies, storybook
// atmosphere, a hand-drawn "S" mark that builds itself stroke by stroke,
// the book opening, entering the book, the world reveal, then the real
// Sammytopia logo and wordmark.

const STEPS = [
  { key: "dark", holdMs: 700 },
  { key: "first-light", holdMs: 1100 },
  { key: "particles", holdMs: 1500 },
  { key: "star", holdMs: 1100 },
  { key: "butterflies", holdMs: 2000 },
  { key: "storybook", holdMs: 2200 },
  { key: "mark", holdMs: 2400 },
  { key: "book", holdMs: 2200 },
  { key: "entering", holdMs: 1300 },
  { key: "world", holdMs: 2400 },
  { key: "logo", holdMs: 2600 },
  { key: "welcome", holdMs: 1600 },
] as const;

// ---------- tiny synthesized sound engine (no external audio files) ----------

function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensure = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current!;
  };

  const tone = (freq: number, startDelay: number, durationMs: number, opts?: { type?: OscillatorType; gain?: number; sweepTo?: number }) => {
    const ctx = ensure();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = opts?.type ?? "sine";
    const now = ctx.currentTime + startDelay / 1000;
    osc.frequency.setValueAtTime(freq, now);
    if (opts?.sweepTo) {
      osc.frequency.linearRampToValueAtTime(opts.sweepTo, now + durationMs / 1000);
    }
    const peak = opts?.gain ?? 0.08;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peak, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.05);
  };

  const chime = (startDelay: number) => {
    tone(523.25, startDelay, 1400, { gain: 0.06 });
    tone(659.25, startDelay + 120, 1400, { gain: 0.05 });
    tone(783.99, startDelay + 240, 1600, { gain: 0.05 });
  };

  const twinkle = (startDelay: number) => tone(1046.5, startDelay, 500, { gain: 0.03, type: "sine" });
  const swell = (startDelay: number) => tone(196, startDelay, 2000, { type: "sine", gain: 0.05, sweepTo: 261.6 });
  const firstLight = (startDelay: number) => tone(392, startDelay, 900, { gain: 0.04 });

  return { firstLight, twinkle, swell, chime, ensure };
}

export default function Intro({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sound = useSoundEngine();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!started || reduceMotion) return;
    if (stepIndex >= STEPS.length) {
      finish();
      return;
    }
    const key = STEPS[stepIndex].key;
    if (key === "first-light") sound.firstLight(100);
    if (key === "star") sound.twinkle(200);
    if (key === "book") sound.swell(100);
    if (key === "logo") sound.chime(150);

    const t = setTimeout(() => setStepIndex((i) => i + 1), STEPS[stepIndex].holdMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, started, reduceMotion]);

  const finish = () => {
    sessionStorage.setItem("sammytopia-intro-seen", "1");
    onDone();
  };

  const begin = () => {
    sound.ensure(); // unlock audio on this user gesture
    setStarted(true);
  };

  if (reduceMotion) {
  return (
      <div style={introWrap}>
        <div style={{ textAlign: "center" }}>
          <img src="/media/branding/sammytopia-logo.png" alt="Sammytopia logo" style={{ width: 120, margin: "0 auto 16px" }} />
          <p style={eyebrow}>A world of ideas awaits</p>
          <h1 style={logoText}>SAMMYTOPIA</h1>
          <p style={{ color: "#c9a227", fontFamily: "var(--font-display)", fontStyle: "italic" }}>No Limits. No Boundaries.</p>
          <p style={{ color: "rgba(253,252,248,0.7)", fontFamily: "var(--font-ui)", fontSize: "0.9rem" }}>Building Ideas, Shaping Tomorrow.</p>
          <button onClick={finish} style={enterBtn}>Enter Sammytopia</button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={introWrap} onClick={begin} role="button" tabIndex={0} aria-label="Touch to enter Sammytopia">
        <div style={{ textAlign: "center", animation: "fadeUp 1.4s ease-out both" }}>
          <p style={{ ...eyebrow, marginBottom: 18 }}>Sammytopia</p>
          <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.1rem", opacity: 0.85 }}>
            Touch to enter
          </p>
        </div>
        <style>{`@keyframes fadeUp { 0%{opacity:0; transform:translateY(12px)} 100%{opacity:1; transform:translateY(0)} }`}</style>
      </div>
    );
  }

  const step = STEPS[stepIndex]?.key;
  const idx = (key: string) => STEPS.findIndex((s) => s.key === key);
  const reached = (key: string) => stepIndex >= idx(key);

  const particles = Array.from({ length: 34 }, (_, i) => (
    <span key={i} aria-hidden style={{
      position: "absolute", top: `${(i * 23) % 100}%`, left: `${(i * 41) % 100}%`,
      width: i % 6 === 0 ? 4 : 2, height: i % 6 === 0 ? 4 : 2, borderRadius: "50%",
      background: "radial-gradient(circle, #f3d77e 0%, #c9a227 70%, transparent 100%)",
      opacity: 0.7, animation: `driftParticle ${6 + (i % 5)}s ease-in-out ${i * 0.15}s infinite`,
    }} />
  ));

  const bgStars = Array.from({ length: 50 }, (_, i) => (
    <span key={i} aria-hidden style={{
      position: "absolute", top: `${(i * 31) % 100}%`, left: `${(i * 59) % 100}%`,
      width: 1.5, height: 1.5, borderRadius: "50%", background: "#fff", opacity: 0.5,
      animation: `sparkle ${3 + (i % 4)}s ease-in-out ${i * 0.09}s infinite`,
    }} />
  ));

  return (
    <div style={introWrap}>
      <style>{`
        @keyframes sparkle { 0%,100%{opacity:.15} 50%{opacity:.9} }
        @keyframes driftParticle { 0%{transform:translate(0,0);opacity:.3} 50%{transform:translate(14px,-22px);opacity:.9} 100%{transform:translate(-8px,-4px);opacity:.3} }
        @keyframes growLight { 0%{opacity:0; transform:scale(.2)} 100%{opacity:1; transform:scale(1)} }
        @keyframes starPulse { 0%,100%{opacity:.6; transform:scale(1)} 50%{opacity:1; transform:scale(1.15)} }
        @keyframes flutter { 0%{transform:translate(-10vw,20vh) rotate(-6deg); opacity:0} 10%{opacity:.9} 50%{transform:translate(45vw,5vh) rotate(8deg)} 90%{opacity:.9} 100%{transform:translate(100vw,30vh) rotate(-4deg); opacity:0} }
        @keyframes wingFlap { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(.55)} }
        @keyframes mistDrift { 0%{transform:translateX(-4%)} 100%{transform:translateX(4%)} }
        @keyframes bookOpen { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(-35deg)} }
        @keyframes fadeUp { 0%{opacity:0; transform:translateY(12px)} 100%{opacity:1; transform:translateY(0)} }
        @keyframes zoomIn { 0%{transform:scale(1); opacity:1} 100%{transform:scale(6); opacity:0} }
        @keyframes roadGlow { 0%,100%{opacity:.5} 50%{opacity:.9} }
        @keyframes drawMark { to { stroke-dashoffset: 0; } }
        @keyframes logoFadeIn { 0%{opacity:0; transform:scale(.9)} 100%{opacity:1; transform:scale(1)} }
      `}</style>

      {reached("storybook") && (
        <>
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 15%, rgba(240,230,190,0.12), transparent 40%)" }} />
          <div aria-hidden style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "18%", height: 90, background: "linear-gradient(90deg, transparent, rgba(200,200,220,0.10), transparent)", filter: "blur(10px)", animation: "mistDrift 9s ease-in-out infinite alternate" }} />
          <svg aria-hidden style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "22%", opacity: 0.55 }} viewBox="0 0 400 60" preserveAspectRatio="none">
            <polygon points="0,60 0,40 20,20 40,40 60,25 80,45 100,15 130,42 160,30 190,48 220,20 250,44 280,32 310,50 340,18 370,46 400,35 400,60" fill="#050a14" />
            <polygon points="130,42 140,10 150,42" fill="#050a14" />
          </svg>
        </>
      )}

      {reached("particles") && <div style={{ position: "absolute", inset: 0 }}>{particles}</div>}
      {step === "first-light" && (
        <div aria-hidden style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #fff7dc 0%, #c9a227 60%, transparent 100%)", boxShadow: "0 0 40px 12px rgba(201,162,39,0.5)", animation: "growLight 1s ease-out both" }} />
      )}

      {reached("storybook") && <div style={{ position: "absolute", inset: 0 }}>{bgStars}</div>}

      {reached("star") && (
        <div aria-hidden style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", fontSize: 22, color: "#f3d77e", animation: "starPulse 2.4s ease-in-out infinite", textShadow: "0 0 18px rgba(243,215,126,0.8)" }}>✦</div>
      )}

      {(step === "butterflies" || (reached("butterflies") && stepIndex < idx("mark"))) && (
        <>
          <Butterfly top="55%" delay={0} scale={1} />
          <Butterfly top="35%" delay={1.4} scale={0.75} />
          <Butterfly top="68%" delay={2.6} scale={0.6} />
        </>
      )}

      {/* the "S" mark draws itself, then the book takes over */}
      {(step === "mark" || step === "book") && (
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
          <path
            d="M78 34 C78 22, 42 22, 42 38 C42 54, 78 58, 78 78 C78 96, 42 96, 42 82"
            fill="none" stroke="#c9a227" strokeWidth="6" strokeLinecap="round"
            style={{
              strokeDasharray: 220,
              strokeDashoffset: 220,
              animation: "drawMark 1.8s ease-out forwards",
              filter: "drop-shadow(0 0 10px rgba(201,162,39,0.6))",
            }}
          />  
</svg>
      )}

      {reached("book") && (
        <div aria-hidden style={{
          position: "relative", width: 120, height: 84, perspective: 400, margin: "0 auto",
          animation: step === "book" ? "growLight 1s ease-out both" : undefined,
          transform: reached("entering") ? "scale(1.4)" : undefined,
          transition: "transform 1.1s ease-in",
        }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: "linear-gradient(135deg, #3a2c12, #1c1608)" }} />
          <div style={{
            position: "absolute", left: "50%", top: 4, bottom: 4, width: "48%",
            background: "linear-gradient(120deg, #f3d77e, #c9a227)", borderRadius: "2px 4px 4px 2px",
            transformOrigin: "left center", boxShadow: "0 0 50px 14px rgba(201,162,39,0.55)",
            animation: reached("entering") ? "bookOpen 1.1s ease-out forwards" : "bookOpen 1.6s ease-out 0.4s forwards",
          }} />
        </div>
      )}

      {step === "entering" && (
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle, #fff7dc, #c9a227 60%, transparent 100%)", animation: "zoomIn 1.2s ease-in forwards" }} />
      )}

      {step === "storybook" && <p style={{ ...introLine, animation: "fadeUp 1s ease-out both", marginTop: 24 }}>A WORLD OF IDEAS AWAITS...</p>}
      {step === "book" && <p style={{ ...introLine, animation: "fadeUp 1s ease-out 0.6s both", marginTop: 24 }}>TURN THE PAGE.</p>}

      {step === "world" && (
        <div aria-hidden style={{ position: "relative", width: "70%", maxWidth: 420, height: 140, animation: "fadeUp 1.2s ease-out both" }}>
          <svg viewBox="0 0 400 160" style={{ width: "100%", height: "100%" }}>
            <polygon points="170,160 230,160 210,60 190,60" fill="url(#roadGrad)" style={{ animation: "roadGlow 2.4s ease-in-out infinite" }} />
            <defs><linearGradient id="roadGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f3d77e" stopOpacity="0.9" /><stop offset="100%" stopColor="#f3d77e" stopOpacity="0" /></linearGradient></defs>
            <rect x="60" y="90" width="18" height="70" fill="#16233d" />
            <rect x="82" y="70" width="18" height="90" fill="#1c2d4d" />
            <rect x="300" y="80" width="18" height="80" fill="#1c2d4d" />
            <rect x="322" y="100" width="18" height="60" fill="#16233d" />
            <text x="200" y="35" textAnchor="middle" fontSize="20" fill="#f3d77e" style={{ filter: "drop-shadow(0 0 8px #c9a227)" }}>✦</text>
            <circle cx="200" cy="95" r="14" fill="none" stroke="#c9a227" strokeWidth="1" opacity="0.8" />
            <ellipse cx="200" cy="95" rx="14" ry="5" fill="none" stroke="#c9a227" strokeWidth="0.7" opacity="0.6" />
            <line x1="186" y1="95" x2="214" y2="95" stroke="#c9a227" strokeWidth="0.7" opacity="0.6" />
          </svg>
        </div>
      )}

      {reached("logo") && (
        <div style={{ textAlign: "center", animation: step === "logo" ? "fadeUp 1.2s ease-out both" : undefined }}>
          <img
            src="/media/branding/sammytopia-logo.png"
            alt="Sammytopia logo"
            style={{ width: 110, margin: "0 auto 14px", animation: "logoFadeIn 1.4s ease-out both", filter: "drop-shadow(0 0 24px rgba(201,162,39,0.5))" }}
          />
          <h1 style={{ ...logoText, textShadow: "0 0 30px rgba(201,162,39,0.5)" }}>SAMMYTOPIA</h1>
          <p style={{ color: "#c9a227", fontFamily: "var(--font-display)", fontStyle: "italic", marginBottom: 4 }}>No Limits. No Boundaries.</p>
          <p style={{ color: "rgba(253,252,248,0.75)", fontFamily: "var(--font-ui)", fontSize: "0.9rem" }}>Building Ideas, Shaping Tomorrow.</p>
        </div>
      )}

      {step === "welcome" && (
        <p style={{ marginTop: 22, fontFamily: "var(--font-ui)", fontSize: "0.85rem", letterSpacing: "0.04em", color: "rgba(253,252,248,0.6)", animation: "fadeUp 1s ease-out both" }}>
          WELCOME TO SAMMYTOPIA
        </p>
      )}
    </div>
  );
}

function Butterfly({ top, delay, scale }: { top: string; delay: number; scale: number }) {
  return (
    <div aria-hidden style={{ position: "absolute", top, left: 0, animation: `flutter ${7 + delay}s ease-in-out ${delay}s 1`, transform: `scale(${scale})` }}>
      <svg width="26" height="20" viewBox="0 0 26 20">
        <g style={{ transformOrigin: "13px 10px", animation: "wingFlap 0.4s ease-in-out infinite" }}>
          <path d="M13 10 C8 0, 0 2, 2 10 C0 18, 8 20, 13 10 Z" fill="#c9a227" opacity="0.85" />
          <path d="M13 10 C18 0, 26 2, 24 10 C26 18, 18 20, 13 10 Z" fill="#f3d77e" opacity="0.85" />
        </g>
        <line x1="13" y1="6" x2="13" y2="14" stroke="#2a1f08" strokeWidth="1" />
      </svg>
    </div>
  );
}

const introWrap: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
  flexDirection: "column", background: "radial-gradient(ellipse at 50% 30%, #16233d 0%, #0b1220 55%, #05070c 100%)",
  color: "#fdfcf8", overflow: "hidden", textAlign: "center", cursor: "default",
};

const eyebrow: React.CSSProperties = { fontFamily: "var(--font-ui)", fontSize: "0.8rem", letterSpacing: "0.06em", color: "#a5841c", marginBottom: 8 };
const introLine: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "clamp(1.1rem, 4vw, 1.6rem)", letterSpacing: "0.04em", color: "#fdfcf8" };
const logoText: React.CSSProperties = { fontSize: "clamp(2.4rem, 8vw, 4rem)", letterSpacing: "0.03em", color: "#fdfcf8", margin: "0 0 8px" };
const enterBtn: React.CSSProperties = { marginTop: 24, background: "transparent", border: "1px solid #c9a227", color: "#c9a227", padding: "10px 22px", borderRadius: 3, cursor: "pointer", fontFamily: "var(--font-ui)" };
