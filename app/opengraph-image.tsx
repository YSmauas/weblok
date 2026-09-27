import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WEblok - smart website blocks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** תמונת שיתוף (Open Graph / Twitter). טקסט באנגלית - הגופן המובנה של next/og לא כולל עברית. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(circle at 20% 0%, #1f2a18 0%, #0a0d0a 60%)",
          color: "#eaf0e3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 32 32">
            <path
              d="M8,8 L12,8 C12,4 14,2 16,2 C18,2 20,4 20,8 L24,8 L24,12 C20,12 20,20 24,20 L24,24 L8,24 Z"
              fill="rgba(143,174,111,0.25)"
              stroke="#8fae6f"
              strokeWidth="1.4"
            />
          </svg>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>WEblok</div>
        </div>
        <div style={{ fontSize: 44, marginTop: 32, color: "#8fae6f", fontWeight: 700 }}>
          Smart blocks for your website
        </div>
        <div style={{ fontSize: 30, marginTop: 20, color: "#9cab8e", maxWidth: 900 }}>
          Live editor · AI editing · Standalone code export · AI injection into existing projects
        </div>
      </div>
    ),
    size
  );
}
