import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const [asciiSnow, setAsciiSnow] = useState<Array<{ id: number; t: string; x: number; y: number }>>([]);

  useEffect(() => {
    console.error("404", location.pathname);
    const ghost = () => ({
      id: Math.random(),
      t: "01".charAt(Math.floor(Math.random() * 2)),
      x: Math.random() * 100,
      y: -20
    });
    setAsciiSnow(Array.from({ length: 50 }, ghost));

    const itv = setInterval(() => {
      setAsciiSnow((prev) =>
        prev
          .map((g) => ({ ...g, y: g.y + 0.7 }))
          .filter((g) => g.y < 120)
          .concat(Math.random() < 0.3 ? ghost() : (null as any))
          .filter(Boolean)
      );
    }, 100);
    return () => clearInterval(itv);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black text-[#F8F8F0] font-mono overflow-hidden">
      {/* pixel rain backdrop */}
      {asciiSnow.map((g) => (
        <span
          key={g.id}
          className="absolute text-[#3AFF5C] opacity-60 text-sm pointer-events-none"
          style={{ left: g.x + "%", top: g.y + "%", transition: "top 0.2s linear" }}
        >
          {g.t}
        </span>
      ))}

      {/* scan line overlay */}
      <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-20" />

      {/* centered block */}
      <div className="relative z-10 text-center px-6 py-4">
        <h1 className="text-[6rem] leading-none tracking-tighter text-[#3AFF5C] drop-shadow-[0_0_6px_#3AFF5C]">
          404
        </h1>
        <p className="mt-3 text-xl text-[#424242] uppercase tracking-wider">
          path decay detected
        </p>

        <a
          href="/"
          className="mt-6 inline-block border border-[#3AFF5C] px-4 py-2 text-sm text-[#3AFF5C] hover:bg-[#3AFF5C] hover:text-black transition-all"
        >
          back to grid
        </a>
      </div>
    </div>
  );
};

export default NotFound;

/* global.css snippet for scanlines */
/*
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');

.bg-scanlines {
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(58,255,92,0.03) 0 1px,
      transparent 1px 2px
    );
}
html { font-family: "IBM Plex Mono", monospace; }
*/
