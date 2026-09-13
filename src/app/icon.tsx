import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#100D0C",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: 30,
            fontWeight: 600,
            color: "#7BE0AD",
          }}
        >
          JC
        </div>
      </div>
    ),
    size
  );
}
