"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = useMemo(() => createClient(), []);

  // Pre-fetch config in parallel with HomeApp dynamic bundle load
  const configPromiseRef = useRef<Promise<any> | null>(null);
  if (!configPromiseRef.current) {
    configPromiseRef.current = Promise.resolve(supabase.from("configuracoes").select("*").limit(1).single().then(r => r.data));
  }

  const [view, setView] = useState<"home" | "menu">("home");
  const [activeTab, setActiveTab] = useState<"menu" | "sacola" | "pedidos">("menu");
  const [filterCategories, setFilterCategories] = useState<string[] | null>(null);
  const [filterSubcategoria, setFilterSubcategoria] = useState<string | string[] | null>(null);
  const [searchProductName, setSearchProductName] = useState<string | null>(null);

  // Reserva Welcome State
  const [reservaInfo, setReservaInfo] = useState<{ativa: boolean, nome: string} | null>(null);
  const [showReservaWelcome, setShowReservaWelcome] = useState(false);

  useEffect(() => {
    const fetchReserva = async () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('t');
        if (token) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase.from('mesas') as any).select('reserva_ativa, reserva_nome, reserva_data').eq('token', token).single();
          if (data && data.reserva_ativa) {
            // Mostra o modal apenas se não tiver data, ou se a data for hoje
            let showModal = false;
            if (!data.reserva_data) {
              showModal = true;
            } else {
              try {
                // Supabase store time in UTC format string, e.g. "2026-04-08T00:00:00+00:00"
                const rawDate = data.reserva_data.split(/[T ]/)[0];
                const [resYear, resMonth, resDay] = rawDate.split('-').map(Number);

                // Convert server current time to São Paulo local timezone
                const spDateStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const spNow = new Date(spDateStr);

                const isSameDay = (
                  resYear === spNow.getFullYear() &&
                  resMonth === (spNow.getMonth() + 1) &&
                  resDay === spNow.getDate()
                );

                // Mostra o modal da reserva apenas no próprio dia E a partir das 12:00 (meio-dia)
                showModal = isSameDay && spNow.getHours() >= 12;
              } catch(e) {
                showModal = true;
              }
            }

            if (showModal) {
              setReservaInfo({ ativa: true, nome: data.reserva_nome as string ?? '' });
              setShowReservaWelcome(true);
            }
          }
        }
      }
    };
    fetchReserva();
  }, [supabase]);


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
      {/* Both views stay mounted — prevents image reload on navigation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          visibility: view === "home" ? "visible" : "hidden",
          pointerEvents: view === "home" ? "auto" : "none",
          zIndex: view === "home" ? 1 : 0,
        }}
      >
        <HomeApp
          onCategorySelect={handleCategorySelect}
          onProductSearch={handleProductSearch}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          configPromise={configPromiseRef.current}
        />
      </div>

      <AnimatePresence>
        {view === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={pageTransition}
            style={{ position: "absolute", inset: 0, zIndex: 2, willChange: "transform, opacity" }}
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
            className="fixed inset-0 z-[99999] flex items-center justify-center text-center"
            style={{ 
              backgroundColor: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              padding: "20px"
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-[36px] flex flex-col items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,1)]"
              style={{
                width: "90%",
                maxWidth: "380px",
                minHeight: "400px",
                padding: "60px 30px",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset"
              }}
            >
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}>
                <Store color="rgba(255,255,255,0.9)" size={64} strokeWidth={1} />
              </div>
              
              <h2 className="font-semibold text-white tracking-tight" style={{ fontSize: "28px", marginBottom: "16px", lineHeight: "1.1" }}>
                {statusInfo?.message === "Fechado temporariamente" ? "Fechado" : "Estamos Fechados"}
              </h2>
              
              <p className="font-medium text-neutral-400" style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "0px", marginInline: "10px" }}>
                {statusInfo?.message || "Nosso estabelecimento encontra-se fechado no momento. Agradecemos a compreensão."}
              </p>

              {nextOpeningText && (
                <div className="w-full bg-white/5 border border-white/5 flex items-center justify-center gap-3" style={{ marginTop: "40px", padding: "18px", borderRadius: "18px" }}>
                  <Clock className="w-5 h-5 text-neutral-400" />
                  <span className="font-medium text-neutral-300" style={{ fontSize: "15px" }}>
                    Voltamos {nextOpeningText}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESERVA WELCOME MODAL */}
      <AnimatePresence>
        {showReservaWelcome && reservaInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center"
            style={{ 
              backgroundColor: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: "24px"
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              style={{
                width: "100%",
                maxWidth: "360px",
                backgroundColor: "#000000",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                padding: "40px 28px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                boxShadow: "0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            >
              {/* Logo — sem fundo, logo tem transparência */}
              <img
                src="https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870490/migrated/csxl9gvgqpm5vqj8ww5w.png"
                alt="Seu Manel"
                style={{ width: "72px", height: "auto", filter: "brightness(0) invert(1)", marginBottom: "28px", objectFit: "contain" }}
              />

              {/* Títulos */}
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontFamily: "inherit" }}>
                Seja bem-vindo ao
              </p>
              <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "4px" }}>
                Seu Manel
              </h2>

              {/* Divisor com brilho */}
              <div style={{ width: "40px", height: "2px", background: "#ff5e1e", borderRadius: "2px", margin: "20px auto" }} />

              {/* Nome do cliente */}
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                Reserva confirmada para
              </p>
              <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#ff5e1e", letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "20px" }}>
                {reservaInfo.nome}
              </h3>

              {/* Mensagem */}
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "32px" }}>
                É uma honra receber você.<br />Sinta-se em casa e aproveite!
              </p>

              {/* Botão CTA */}
              <button
                onClick={() => setShowReservaWelcome(false)}
                style={{
                  width: "100%",
                  backgroundColor: "#ff5e1e",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 0",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#e54e15")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#ff5e1e")}
              >
                Ver Cardápio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


