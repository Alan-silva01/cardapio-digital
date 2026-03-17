"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Loader2, Home, ShoppingBag, ClipboardList } from "lucide-react";

const HomeApp = dynamic(() => import("./HomeApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100dvh",
        background: "#000000",
      }}
    >
      <Loader2 className="animate-spin" style={{ color: "#333" }} size={36} />
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

/* ── Bottom Nav Item ── */
function NavItem({
  icon: Icon,
  label,
  active,
  onTap,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onTap: () => void;
  badge?: number;
}) {
  return (
    <motion.button
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 16px",
        color: active ? "#FFFFFF" : "#6B7280",
        transition: "color 0.2s ease",
        fontFamily: "inherit",
        position: "relative",
      }}
      whileTap={{ scale: 0.85 }}
      onClick={onTap}
    >
      <div style={{ position: "relative" }}>
        <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
        {badge && badge > 0 && (
          <div style={{
            position: "absolute",
            top: "-5px",
            right: "-8px",
            background: "#FFFFFF",
            color: "#000000",
            fontSize: "9px",
            fontWeight: "800",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {badge}
          </div>
        )}
      </div>
      <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.2px" }}>{label}</span>
    </motion.button>
  );
}

export default function MenuPage() {
  const [view, setView] = useState<"home" | "menu">("home");
  const [activeTab, setActiveTab] = useState<"menu" | "sacola" | "pedidos">("menu");
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

  const handleTabChange = (tab: "menu" | "sacola" | "pedidos") => {
    setActiveTab(tab);
    if (tab === "menu") {
      if (view === "menu") {
        handleBackToHome();
      }
    } else if (tab === "sacola" || tab === "pedidos") {
      // Switch to menu view so MenuApp can show the cart/orders overlay
      setView("menu");
    }
  };

  return (
    <>
      {/* HomeApp — always mounted, hidden when on menu */}
      <div style={{ display: view === "home" ? "block" : "none" }}>
        <HomeApp
          onCategorySelect={handleCategorySelect}
          onProductSearch={handleProductSearch}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* MenuApp — always mounted after first render, hidden when on home */}
      <div style={{ display: view === "menu" ? "block" : "none" }}>
        <MenuApp
          isActive={view === "menu"}
          filterCategories={filterCategories}
          searchProductName={searchProductName}
          onBack={handleBackToHome}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    </>
  );
}
