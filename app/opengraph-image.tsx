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
          <svg width="96" height="96" viewBox="0 0 32 32" fill="#8fae6f">
            <rect x="3" y="3" width="12" height="12" rx="3.2" fillOpacity="0.38" />
            <rect x="3" y="17" width="12" height="12" rx="3.2" fillOpacity="0.6" />
            <rect x="17" y="17" width="12" height="12" rx="3.2" fillOpacity="0.38" />
            <circle cx="9" cy="16" r="2.3" fillOpacity="0.6" />
            <circle cx="16" cy="23" r="2.3" fillOpacity="0.6" />
            <g transform="rotate(-8 23 9)">
              <path d="M20 2.6h6a3.2 3.2 0 0 1 3.2 3.2v6a3.2 3.2 0 0 1-3.2 3.2h-6a3.2 3.2 0 0 1-3.2-3.2V11a2.2 2.2 0 1 0 0-4.4V5.8A3.2 3.2 0 0 1 20 2.6Z" />
            </g>
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
