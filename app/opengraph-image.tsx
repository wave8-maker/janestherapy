import { ImageResponse } from "next/og";

export const alt = "Jane's Therapy — Massage Therapist in Palo Alto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social share card. Uses flexbox + default font only (satori-safe, no network fetch).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #faf7f4 0%, #f0e6dd 55%, #e3d3c6 100%)",
          color: "#3d2b1f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "9999px",
              background: "#a78a7b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            J
          </div>
          <div
            style={{
              fontSize: "30px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "#8a6f63",
            }}
          >
            Jane&apos;s Therapy
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ fontSize: "82px", fontWeight: 700, lineHeight: 1.05, maxWidth: "900px" }}>
            Massage Therapy in Palo Alto
          </div>
          <div style={{ fontSize: "36px", color: "#6b4c3b" }}>
            Deep tissue · Swedish · Lymphatic · TCM bodywork
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "28px",
            color: "#8a6f63",
          }}
        >
          <span>Jane Zhang, CMT</span>
          <span>•</span>
          <span>By appointment · Bay Area</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
