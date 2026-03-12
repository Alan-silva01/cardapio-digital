"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the menu app with SSR disabled
// This prevents localStorage/window crashes during Next.js pre-rendering
const MenuApp = dynamic(() => import("./MenuApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100dvh",
        background: "#111",
      }}
    >
      <Loader2
        className="animate-spin text-white"
        size={48}
      />
    </div>
  ),
});

export default function MenuPage() {
  return <MenuApp />;
}
