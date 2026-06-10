import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./menu.css";
import "./home.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cardápio Digital | Seu Manel",
  description: "Acesse o cardápio digital do Seu Manel e faça seu pedido!",
  manifest: "/manifest.json",
  openGraph: {
    title: "Cardápio Digital | Seu Manel",
    description: "Acesse o cardápio digital do Seu Manel e faça seu pedido!",
    siteName: "Seu Manel",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "https://seumanel.vercel.app/opengraph-image",
        width: 810,
        height: 810,
        alt: "Cardápio Digital | Seu Manel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardápio Digital | Seu Manel",
    description: "Acesse o cardápio digital do Seu Manel e faça seu pedido!",
    images: ["https://seumanel.vercel.app/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Seu Manel",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${playfair.variable} w-full h-full`} data-menu-app>
      {children}
    </div>
  );
}
