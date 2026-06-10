import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://seumanel.vercel.app";

// Logo com fundo — gerado pelo Next.js (opengraph-image)
const OG_IMAGE = `${SITE_URL}/opengraph-image`;

// ─── Supabase anon client (sem cookies — só leitura pública) ───────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Busca o número da mesa pelo token ─────────────────────────────────────
async function getMesaNumero(token: string): Promise<number | null> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("mesas")
      .select("numero")
      .eq("token", token)
      .single();
    return data?.numero ?? null;
  } catch {
    return null;
  }
}

// ─── Metadata dinâmico para WhatsApp / redes sociais ───────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const numero = await getMesaNumero(token);

  const title = numero
    ? `Cardápio Digital — Mesa ${numero} | Seu Manel`
    : "Cardápio Digital | Seu Manel";

  const description = numero
    ? `Você está na Mesa ${numero}. Acesse o cardápio digital do Seu Manel e faça seu pedido!`
    : "Acesse o cardápio digital do Seu Manel e faça seu pedido!";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Seu Manel",
      type: "website",
      locale: "pt_BR",
      images: [{ url: OG_IMAGE, width: 810, height: 810, alt: "Seu Manel" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

// ─── Page: HTML real com meta refresh ──────────────────────────────────────
// Usar redirect() server-side envia HTTP 307 sem body — o bot do WhatsApp
// nunca vê as tags OG. Aqui renderizamos HTML real + meta refresh:
// • Bots (WhatsApp, Telegram) lêem o <head> e param aqui ✅
// • Browsers executam o meta refresh e vão pro /menu?t=TOKEN ✅
export default async function MesaRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const numero = await getMesaNumero(token);
  const menuUrl = `/menu?t=${token}`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta httpEquiv="refresh" content={`0;url=${menuUrl}`} />
      </head>
      <body
        style={{
          margin: 0,
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
          fontFamily: "sans-serif",
          color: "#fff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={OG_IMAGE}
          alt="Seu Manel"
          style={{ width: 80, filter: "brightness(0) invert(1)" }}
        />
        <p style={{ margin: 0, opacity: 0.5, fontSize: 14 }}>
          {numero ? `Mesa ${numero} — ` : ""}Abrindo cardápio...
        </p>
      </body>
    </>
  );
}
