"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
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
        background: "#000000",
      }}
    >
      <Loader2 className="animate-spin" style={{ color: "#333" }} size={36} />
    </div>
  ),
});

const MenuApp = dynamic<any>(() => import("./MenuApp"), {
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
  diversos: ["Diversos"],
  danos: ["Danos"],
};

/* ── Page transition variants ── */
const pageVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1] as const,
};

export default function MenuPage() {
  const [view, setView] = useState<"home" | "menu">("home");
  const [activeTab, setActiveTab] = useState<"menu" | "sacola" | "pedidos">("menu");
  const [filterCategories, setFilterCategories] = useState<string[] | null>(null);
  const [filterSubcategoria, setFilterSubcategoria] = useState<string | string[] | null>(null);
  const [searchProductName, setSearchProductName] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: string, dbCategories?: string[], subcategoria?: string | string[]) => {
    const cats = dbCategories || CATEGORY_MAP[categoryId] || null;
    setFilterCategories(cats);
    setFilterSubcategoria(subcategoria || null);
    setSearchProductName(null);
    setActiveTab("menu");
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
    setFilterSubcategoria(null);
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
    <AnimatePresence mode="wait">
      {view === "home" ? (
        <motion.div
          key="home"
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
          style={{ position: "absolute", inset: 0, willChange: "transform, opacity" }}
        >
          <HomeApp
            onCategorySelect={handleCategorySelect}
            onProductSearch={handleProductSearch}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </motion.div>
      ) : (
        <motion.div
          key="menu"
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
          style={{ position: "absolute", inset: 0, willChange: "transform, opacity" }}
        >
          <MenuApp
            isActive={view === "menu"}
            filterCategories={filterCategories}
            filterSubcategoria={filterSubcategoria}
            searchProductName={searchProductName}
            onBack={handleBackToHome}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
