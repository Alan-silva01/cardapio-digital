"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const HomeApp = dynamic(() => import("./HomeApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100dvh",
        background: "#e8e8e8",
      }}
    >
      <Loader2 className="animate-spin" style={{ color: "#999" }} size={36} />
    </div>
  ),
});

const MenuApp = dynamic(() => import("./MenuApp"), {
  ssr: false,
});

// Maps HomeApp macro-category IDs to DB category names
const CATEGORY_MAP: Record<string, string[]> = {
  cervejas: ["Cervejas"],
  drinks: ["Drinks", "Gins"],
  destilados: ["Destilados", "Whiskeys", "Vodkas", "Combos"],
  vinhos: ["Vinhos"],
  "nao-alcoolicos": ["Bebidas"],
  petiscos: ["Petiscos", "Pastéis"],
  grelha: ["Espetinhos", "Pratos & Executivos", "Guarnições"],
  sobremesas: ["Sobremesas"],
};

export default function MenuPage() {
  const [view, setView] = useState<"home" | "menu">("home");
  const [filterCategories, setFilterCategories] = useState<string[] | null>(null);
  const [searchProductName, setSearchProductName] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: string, dbCategories?: string[]) => {
    const cats = dbCategories || CATEGORY_MAP[categoryId] || null;
    setFilterCategories(cats);
    setSearchProductName(null);
    setView("menu");
  };

  const handleProductSearch = (productName: string) => {
    setSearchProductName(productName);
    setFilterCategories(null);
    setView("menu");
  };

  const handleBackToHome = () => {
    setView("home");
    setFilterCategories(null);
    setSearchProductName(null);
  };

  return (
    <>
      {/* HomeApp — always mounted, hidden when on menu */}
      <div style={{ display: view === "home" ? "block" : "none" }}>
        <HomeApp
          onCategorySelect={handleCategorySelect}
          onProductSearch={handleProductSearch}
        />
      </div>

      {/* MenuApp — always mounted after first render, hidden when on home */}
      <div style={{ display: view === "menu" ? "block" : "none" }}>
        <MenuApp
          isActive={view === "menu"}
          filterCategories={filterCategories}
          searchProductName={searchProductName}
          onBack={handleBackToHome}
        />
      </div>
    </>
  );
}
