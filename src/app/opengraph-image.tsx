import { ImageResponse } from "next/og";

export const alt = "Jayesh Chawla — Senior Frontend Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: "#100D0C",
          color: "#F2EDE8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#7BE0AD", marginBottom: 28 }}>
          SENIOR FRONTEND ENGINEER · REACT & NEXT.JS · 7+ YEARS
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 600, lineHeight: 1.05, letterSpacing: -3 }}>
          <div>Frontends built</div>
          <div>pixel-perfect, then</div>
          <div>owned in production.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#B4AAA1", marginTop: 36 }}>
          jayeshchawla.dev
        </div>
      </div>
    ),
    size
  );
}
