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

    // Polling every 5s as fallback/clock update (more aggressive to guarantee real-time sync)
    checkInterval.current = setInterval(checkStatus, 5000);

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
    <div className="relative min-h-screen w-full">
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
              isClosed={isClosed}
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
              backgroundColor: "rgba(10, 10, 10, 0.75)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)"
            }}
          >
            {/* Glow effect behind the card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[80px]" />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-[#111] overflow-hidden p-10 rounded-[32px] max-w-sm w-full shadow-2xl"
              style={{
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.03) inset"
              }}
            >
              {/* Subtle top glare */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex p-5 rounded-[24px] bg-red-500/10 mb-8 border border-red-500/20"
              >
                <Store className="w-12 h-12 text-red-400" strokeWidth={1.5} />
              </motion.div>
              
              <h2 className="text-2xl font-semibold text-white tracking-tight mb-4 text-balance">
                {statusInfo?.message === "Fechado temporariamente" ? "Fechado Temporariamente" : "Estamos Fechados"}
              </h2>
              
              <p className="text-gray-400 text-[15px] mb-8 leading-relaxed font-normal text-balance px-2">
                {statusInfo?.message || "Nosso estabelecimento encontra-se fechado no momento. Agradecemos a compreensão."}
              </p>

              {nextOpeningText && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="py-3.5 px-6 bg-white/[0.03] rounded-2xl w-full flex items-center justify-center gap-3 border border-white/[0.05]"
                >
                  <Clock className="w-4 h-4 text-[#CBA365]" />
                  <span className="text-[15px] font-medium tracking-wide text-white/90">
                    Abriremos {nextOpeningText}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

