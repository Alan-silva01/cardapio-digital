import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://menu-seumanel.vercel.app";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Seu Manel",
      type: "website",
      locale: "pt_BR",
      images: [
        {
          url: `${siteUrl}/images/logo_bar.png`,
          width: 512,
          height: 512,
          alt: "Seu Manel — Bar & Restaurante",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [`${siteUrl}/images/logo_bar.png`],
    },
  };
}

// ─── Page: redireciona imediatamente pro /menu?t=TOKEN ─────────────────────
export default async function MesaRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Redirect server-side — bots de link preview (WhatsApp) já leram o <head>
  // antes de seguir o redirect, então o OG fica registrado corretamente.
  redirect(`/menu?t=${token}`);
}
