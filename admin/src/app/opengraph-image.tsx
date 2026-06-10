import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cardápio Digital | Seu Manel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Logo já hospedada no Cloudinary (usada no app — sempre acessível)
const LOGO_URL =
  "https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870490/migrated/csxl9gvgqpm5vqj8ww5w.png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: "0 100px",
        }}
      >
        {/* Logo branca — fica perfeita no fundo preto */}
        <img
          src={LOGO_URL}
          width={240}
          height={240}
          alt="Seu Manel"
          style={{ objectFit: "contain" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              color: "#ffffff",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            Cardápio Digital
          </span>
          <span
            style={{
              color: "#ff5e1e",
              fontSize: 32,
              fontWeight: 500,
            }}
          >
            Seu Manel • Bar &amp; Restaurante
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

