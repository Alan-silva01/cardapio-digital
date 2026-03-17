"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  Beer,
  Wine,
  GlassWater,
  CookingPot,
  Flame,
  IceCreamCone,
  Martini,
  Citrus,
  X,
  ChevronRight,
  ShoppingBag,
  ClipboardList,
  Star,
  Snowflake,
  Sparkles,
  Music,
  UtensilsCrossed,
  Leaf,
  Cake,
  Ban,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─── Subcategory Definitions ─── */
interface SubCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  dbCategories: string[];
}

interface CategoryDef {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  image: string;
  itemCount: number;
  subs: SubCategory[];
}

interface ProductResult {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  imagem_url: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "cervejas",
    label: "Cervejas",
    subtitle: "Long Necks & Garrafas",
    icon: Beer,
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80",
    itemCount: 14,
    subs: [
      { id: "cervejas-all", label: "Todas as Cervejas", icon: Beer, dbCategories: ["Cervejas"] },
      { id: "cervejas-premium", label: "Premium & Importadas", icon: Star, dbCategories: ["Cervejas"] },
      { id: "cervejas-zero", label: "Sem Álcool", icon: Ban, dbCategories: ["Cervejas"] },
    ],
  },
  {
    id: "drinks",
    label: "Drinks",
    subtitle: "Coquetéis & Shots",
    icon: Martini,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
    itemCount: 7,
    subs: [
      { id: "drinks-all", label: "Todos os Drinks", icon: Martini, dbCategories: ["Drinks"] },
      { id: "drinks-gins", label: "Gins", icon: Martini, dbCategories: ["Gins"] },
      { id: "drinks-coqueteis", label: "Coquetéis", icon: Wine, dbCategories: ["Drinks"] },
    ],
  },
  {
    id: "destilados",
    label: "Destilados",
    subtitle: "Garrafas, Doses & Combos",
    icon: GlassWater,
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80",
    itemCount: 9,
    subs: [
      { id: "dest-whiskeys", label: "Whiskeys", icon: GlassWater, dbCategories: ["Whiskeys"] },
      { id: "dest-vodkas", label: "Vodkas", icon: Snowflake, dbCategories: ["Vodkas"] },
      { id: "dest-gins", label: "Gins", icon: Martini, dbCategories: ["Gins"] },
      { id: "dest-outros", label: "Licores & Outros", icon: Wine, dbCategories: ["Destilados"] },
      { id: "dest-combos", label: "Combos", icon: Sparkles, dbCategories: ["Combos"] },
    ],
  },
  {
    id: "vinhos",
    label: "Vinhos",
    subtitle: "Tintos, Brancos & Rosés",
    icon: Wine,
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
    itemCount: 13,
    subs: [
      { id: "vinhos-all", label: "Todos os Vinhos", icon: Wine, dbCategories: ["Vinhos"] },
      { id: "vinhos-espumante", label: "Espumantes", icon: Sparkles, dbCategories: ["Vinhos"] },
    ],
  },
  {
    id: "nao-alcoolicos",
    label: "Sem Álcool",
    subtitle: "Ice, Beats & Energéticos",
    icon: Citrus,
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80",
    itemCount: 11,
    subs: [
      { id: "bebidas-all", label: "Todas as Bebidas", icon: Citrus, dbCategories: ["Bebidas"] },
      { id: "bebidas-ice", label: "Ice", icon: Snowflake, dbCategories: ["Bebidas"] },
      { id: "bebidas-beats", label: "Skol Beats", icon: Music, dbCategories: ["Bebidas"] },
    ],
  },
  {
    id: "petiscos",
    label: "Petiscos",
    subtitle: "Porções & Tábuas",
    icon: CookingPot,
    image: "/images/petiscos.png",
    itemCount: 5,
    subs: [
      { id: "petiscos-all", label: "Todos os Petiscos", icon: CookingPot, dbCategories: ["Petiscos"] },
      { id: "petiscos-pasteis", label: "Pastéis", icon: UtensilsCrossed, dbCategories: ["Pastéis"] },
    ],
  },
  {
    id: "grelha",
    label: "Da Grelha",
    subtitle: "Espetos, Pratos & Executivos",
    icon: Flame,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    itemCount: 8,
    subs: [
      { id: "grelha-espetinhos", label: "Espetinhos", icon: Flame, dbCategories: ["Espetinhos"] },
      { id: "grelha-pratos", label: "Pratos & Executivos", icon: UtensilsCrossed, dbCategories: ["Pratos & Executivos"] },
      { id: "grelha-guarnicoes", label: "Guarnições", icon: Leaf, dbCategories: ["Guarnições"] },
    ],
  },
  {
    id: "sobremesas",
    label: "Sobremesas",
    subtitle: "Pudim & Brownie",
    icon: Cake,
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80",
    itemCount: 3,
    subs: [],
  },
];

/* ─── Animations ─── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

const heroVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

/* ─── Component ─── */
interface HomeAppProps {
  onCategorySelect?: (categoryId: string, dbCategories?: string[]) => void;
  onProductSearch?: (searchTerm: string) => void;
  activeTab?: "menu" | "sacola" | "pedidos";
  onTabChange?: (tab: "menu" | "sacola" | "pedidos") => void;
}

export default function HomeApp({ onCategorySelect, onProductSearch, activeTab = "menu", onTabChange }: HomeAppProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSheet, setOpenSheet] = useState<CategoryDef | null>(null);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cartCount, setCartCount] = useState(0);

  // Read cart from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const saved = localStorage.getItem("@Menu-Cart");
        if (saved) {
          const parsed = JSON.parse(saved);
          const total = Object.values(parsed).reduce((sum: number, qty: any) => sum + qty, 0);
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        setCartCount(0);
      }
    };
    
    updateCartCount();
    
    // Listen for storage changes from other tabs AND custom events from same tab
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);
    
    // Also poll every 2s as a fallback when component is mounted
    const interval = setInterval(updateCartCount, 2000);
    
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
      clearInterval(interval);
    };
  }, []);

  // Prefetch MenuApp bundle silently so transition is near-instant
  useEffect(() => {
    import("./MenuApp");
  }, []);

  // Ref callback to force muted on the DOM element (React bug: muted prop doesn't always stick)
  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (!node) return;
    // @ts-ignore
    videoRef.current = node;
    // Critical: React doesn't reliably set 'muted' on the DOM element
    node.defaultMuted = true;
    node.muted = true;
    node.setAttribute('muted', '');
    node.setAttribute('playsinline', '');
    node.setAttribute('webkit-playsinline', '');
  }, []);

  // Force video autoplay on Safari/iOS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      if (video.paused) {
        video.muted = true; // Re-ensure muted before each attempt
        const p = video.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    };

    // Try on various loading events
    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);

    // Try immediately + retries
    tryPlay();
    const t1 = setTimeout(tryPlay, 100);
    const t2 = setTimeout(tryPlay, 500);
    const t3 = setTimeout(tryPlay, 1500);

    // IntersectionObserver: play when video becomes visible
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) tryPlay();
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(video);
    }

    // Fallback: play on first user interaction
    const onInteraction = () => {
      tryPlay();
      document.removeEventListener('touchstart', onInteraction);
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('scroll', onInteraction);
    };
    document.addEventListener('touchstart', onInteraction, { passive: true });
    document.addEventListener('click', onInteraction);
    document.addEventListener('scroll', onInteraction, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('loadeddata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
      observer?.disconnect();
      document.removeEventListener('touchstart', onInteraction);
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('scroll', onInteraction);
    };
  }, []);

  // Debounced product search
  const searchProducts = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, slug, categoria_id, imagem_url")
        .eq("disponivel", true)
        .ilike("nome", `%${query.trim()}%`)
        .limit(8);

      if (data && data.length > 0) {
        // Get category names
        const catIds = [...new Set(data.map((p: any) => p.categoria_id))];
        const { data: cats } = await supabase
          .from("categorias")
          .select("id, nome")
          .in("id", catIds);

        const catMap: Record<string, string> = {};
        cats?.forEach((c: any) => { catMap[c.id] = c.nome; });

        setSearchResults(
          data.map((p: any) => ({
            id: p.id,
            nome: p.nome,
            slug: p.slug,
            categoria: catMap[p.categoria_id] || "",
            imagem_url: p.imagem_url,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(val), 300);
  };

  const handleProductTap = (product: ProductResult) => {
    setSearchQuery("");
    setSearchResults([]);
    onProductSearch?.(product.nome);
  };

  const filteredCategories = searchQuery.trim().length >= 2
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CATEGORIES;

  const handleCategoryTap = (cat: CategoryDef) => {
    if (cat.subs.length === 0) {
      onCategorySelect?.(cat.id);
    } else {
      setOpenSheet(cat);
    }
  };

  const handleSubSelect = (sub: SubCategory) => {
    setOpenSheet(null);
    onCategorySelect?.(sub.id, sub.dbCategories);
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className="home-shell">
      {/* ── Hero Video — OUTSIDE scroll container for Safari autoplay ── */}
      <div className="home-hero-video" id="home-hero-video">
        <video
          ref={videoRefCallback}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="home-hero-bg"
        >
          <source
            src="https://res.cloudinary.com/ddhlqymvf/video/upload/q_auto:best,ac_none,f_mp4,w_720/v1773773210/Vi%CC%81deo_1280x720_2_mvdnj0.mp4"
            type="video/mp4"
          />
        </video>
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <img
            src="/images/logo_bar.png"
            alt="Logo"
            className="home-hero-logo"
          />
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="home-scroll">
        {/* Spacer to push content below the hero video */}
        <div className="home-hero-spacer" />

        {/* ── Search ── */}
        <div className="home-search-wrap">
          <Search size={18} className="home-search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar produto... ex: Corona, Caipirinha"
            className="home-search-input"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="home-search-clear"
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="search-results">
            {isSearching && (
              <div className="search-loading">Buscando...</div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <>
                <p className="search-results-title">Produtos encontrados</p>
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    className="search-result-item"
                    onClick={() => handleProductTap(p)}
                  >
                    {p.imagem_url && (
                      <img
                        src={p.imagem_url}
                        alt={p.nome}
                        className="search-result-img"
                      />
                    )}
                    <div className="search-result-info">
                      <span className="search-result-name">{p.nome}</span>
                      <span className="search-result-cat">{p.categoria}</span>
                    </div>
                    <ChevronRight size={16} className="search-result-arrow" />
                  </button>
                ))}
              </>
            )}
            {!isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="search-empty">Nenhum produto encontrado</div>
            )}
          </div>
        )}

        {/* Main content only when not searching */}
        {!showSearchResults && (
          <>

            {/* Section Title */}
            <div className="home-section-header">
              <h2 className="home-section-title">Cardápio</h2>
              <span className="home-section-count">{filteredCategories.length} categorias</span>
            </div>

            {/* Categories Grid */}
            <motion.div
              className="home-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {filteredCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  className="home-card"
                  variants={cardVariants}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCategoryTap(cat)}
                >
                  <div className="hc-img-area">
                    <img
                      src={cat.image}
                      alt={cat.label}
                      loading="lazy"
                      decoding="async"
                      className="hc-img"
                    />
                  </div>
                  <div className="hc-body">
                    <div className="hc-title-row">
                      <h3 className="hc-title">{cat.label}</h3>
                      <span className="hc-count">{cat.itemCount} itens</span>
                    </div>
                    <p className="hc-subtitle">{cat.subtitle}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="home-bottom-nav">
        <NavItem icon={Home} label="Menu" active={activeTab === "menu"} onTap={() => onTabChange?.("menu")} />
        <NavItem icon={ShoppingBag} label="Sacola" badge={cartCount} active={activeTab === "sacola"} onTap={() => onTabChange?.("sacola")} />
        <NavItem icon={ClipboardList} label="Pedidos" active={activeTab === "pedidos"} onTap={() => onTabChange?.("pedidos")} />
      </nav>

      {/* ── Subcategory Bottom Sheet ── */}
      <AnimatePresence>
        {openSheet && (
          <>
            <motion.div
              className="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenSheet(null)}
            />
            <motion.div
              className="sheet-container"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="sheet-handle" />
              <div className="sheet-header">
                <div className="sheet-header-info">
                  {(() => { const SheetIcon = openSheet.icon; return <SheetIcon size={22} strokeWidth={2} style={{ color: '#FFFFFF' }} />; })()}
                  <h3 className="sheet-title">{openSheet.label}</h3>
                </div>
                <button className="sheet-close" onClick={() => setOpenSheet(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="sheet-list">
                {openSheet.subs.map((sub, i) => (
                  <motion.button
                    key={sub.id}
                    className="sheet-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2, ease: "easeOut" }}
                    onClick={() => handleSubSelect(sub)}
                  >
                    {(() => { const SubIcon = sub.icon; return <SubIcon size={18} strokeWidth={1.8} style={{ color: '#9CA3AF', flexShrink: 0 }} />; })()}
                    <span className="sheet-item-label">{sub.label}</span>
                    <ChevronRight size={18} className="sheet-item-arrow" />
                  </motion.button>
                ))}
                <motion.button
                  className="sheet-item sheet-item-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: openSheet.subs.length * 0.03, duration: 0.2, ease: "easeOut" }}
                  onClick={() => {
                    setOpenSheet(null);
                    onCategorySelect?.(openSheet.id);
                  }}
                >
                  <ClipboardList size={18} strokeWidth={1.8} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                  <span className="sheet-item-label">Ver tudo</span>
                  <ChevronRight size={18} className="sheet-item-arrow" />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      className={`home-nav-item ${active ? "home-nav-active" : ""}`}
      whileTap={{ scale: 0.85 }}
      onClick={onTap}
      style={{ position: 'relative' }}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
        {badge && badge > 0 ? (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-8px',
            background: '#E53935',
            color: '#fff',
            fontSize: '9px',
            fontWeight: '800',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}>
            {badge}
          </div>
        ) : null}
      </div>
      <span>{label}</span>
    </motion.button>
  );
}
