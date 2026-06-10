import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cardápio Digital | Seu Manel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Busca a logo como buffer para funcionar no edge runtime
  const logoUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://seumanel.vercel.app") +
    "/images/logo_bar.png";

  const logoData = await fetch(logoUrl).then((r) => r.arrayBuffer());

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
          gap: 48,
          padding: "0 80px",
        }}
      >
        {/* Logo — branca no fundo preto fica perfeita */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // @ts-expect-error — ImageResponse aceita ArrayBuffer via src
          src={logoData}
          width={220}
          height={220}
          alt="Seu Manel"
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              color: "#ffffff",
              fontSize: 64,
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
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "0.5px",
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
