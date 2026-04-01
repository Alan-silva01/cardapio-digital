"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Store, Clock, Loader2 } from "lucide-react";

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

  // Business Hours State
  const [isClosed, setIsClosed] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{ open: boolean, message: string, next_change_at: string | null } | null>(null);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('is_establishment_open');
      if (error) throw error;
      
      const info = data as { open: boolean, message: string, next_change_at: string | null };
      setIsClosed(!info.open);
      setStatusInfo(info);
    } catch (err) {
      console.error("Erro ao verificar status do estabelecimento:", err);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkStatus();

    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedCheck = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      // Wait 1.5s to ensure DB replica is fully updated before reading
      debounceTimer = setTimeout(() => {
        checkStatus();
      }, 1500);
    };

    // Realtime subscription
    const configChannel = supabase
      .channel('menu-blocking-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracoes' },
        () => {
          debouncedCheck();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'horarios_funcionamento' },
        () => {
          debouncedCheck();
        }
      )
      .subscribe((status) => {
      });

    // Polling every 60s as fallback/clock update
    checkInterval.current = setInterval(checkStatus, 60000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (checkInterval.current) clearInterval(checkInterval.current);
      supabase.removeChannel(configChannel);
    };
  }, [checkStatus]);

  const handleCategorySelect = (categoryId: string, dbCategories?: string[], subcategoria?: string | string[]) => {
    // ... same as before
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
      setView("menu");
    }
  };

  const nextOpeningText = statusInfo?.next_change_at;

  return (
    <div className="relative min-h-screen">
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

      {/* CLOSED OVERLAY */}
      <AnimatePresence>
        {isClosed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-6 text-center"
            style={{ 
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-black/60 border border-white/10 p-10 rounded-[40px] shadow-2xl max-w-sm w-full"
            >
              <div className="inline-flex p-4 rounded-full bg-white/5 mb-6">
                <Store className="w-10 h-10 text-white/50" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                {statusInfo?.message === "Fechado temporariamente" ? "Fechado para Pedidos" : "Estamos Fechados"}
              </h2>
              
              <p className="text-gray-400 mb-8 leading-relaxed">
                {statusInfo?.message || "Nosso estabelecimento encontra-se fechado no momento. Voltaremos em breve!"}
              </p>

              {nextOpeningText && (
                <div className="py-3 px-6 bg-white/5 rounded-2xl inline-flex items-center gap-3 border border-white/5">
                  <Clock className="w-4 h-4 text-accent-gold" />
                  <span className="text-sm font-medium text-white/90">
                    Abriremos {nextOpeningText}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

