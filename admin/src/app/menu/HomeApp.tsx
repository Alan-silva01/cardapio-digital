"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  Beer,
  Wine,
  BottleWine,
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
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─── Subcategory Definitions ─── */
interface SubCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  dbCategories: string[];
  subcategoria?: string | string[];
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
    itemCount: 34,
    subs: [
      { id: "cervejas-longneck", label: "Long Neck", icon: Beer, dbCategories: ["Cervejas"], subcategoria: "Long Neck" },
      { id: "cervejas-600ml", label: "Cervejas 600ml", icon: BottleWine, dbCategories: ["Cervejas"], subcategoria: ["Cervejas 600ml", "Cerveja 600ml", "Stempel"] },
      { id: "cervejas-zero", label: "Zero Álcool", icon: Ban, dbCategories: ["Cervejas"], subcategoria: ["Zero Álcool", "Cerveja Zero"] },
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
      { id: "drinks-all", label: "Menu de Drinks", icon: Martini, dbCategories: ["Drinks"], subcategoria: "Menu de Drinks" },
      { id: "drinks-shots", label: "Shots", icon: GlassWater, dbCategories: ["Drinks"], subcategoria: "Shots" },
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
      { id: "dest-garrafas", label: "Garrafas", icon: GlassWater, dbCategories: ["Destilados", "Whiskeys", "Vodkas"], subcategoria: ["Garrafas", "Garrafa"] },
      { id: "dest-doses", label: "Doses", icon: GlassWater, dbCategories: ["Destilados", "Whiskeys", "Vodkas"], subcategoria: ["Doses", "Dose"] },
      { id: "dest-gins", label: "Gins", icon: Martini, dbCategories: ["Destilados", "Gins"], subcategoria: ["Gins", "gins"] },
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
      { id: "vinhos-tinto", label: "Vinhos Tintos", icon: Wine, dbCategories: ["Vinhos"], subcategoria: ["Vinhos Tintos", "Tinto"] },
      { id: "vinhos-branco", label: "Vinhos Brancos", icon: Wine, dbCategories: ["Vinhos"], subcategoria: ["Vinhos Brancos", "Branco"] },
      { id: "vinhos-rose", label: "Vinhos Rosés", icon: Wine, dbCategories: ["Vinhos"], subcategoria: ["Vinhos Rosés", "Rosé"] },
      { id: "vinhos-espumante", label: "Espumantes", icon: Sparkles, dbCategories: ["Vinhos"], subcategoria: ["Espumantes", "Espumante"] },
      { id: "vinhos-stempel", label: "Stempel", icon: Beer, dbCategories: ["Vinhos"], subcategoria: "Stempel" },
    ],
  },
  {
    id: "nao-alcoolicos",
    label: "Sem Álcool",
    subtitle: "Refrigerantes & Sucos",
    icon: Citrus,
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80",
    itemCount: 11,
    subs: [
      { id: "bebidas-agua", label: "Água & Refri", icon: GlassWater, dbCategories: ["Bebidas"], subcategoria: ["Água & Refri", "Refrigerantes & Águas"] },
      { id: "bebidas-sucos", label: "Sucos", icon: Citrus, dbCategories: ["Bebidas"], subcategoria: "Sucos" },
      { id: "bebidas-energetico", label: "Energéticos", icon: Zap, dbCategories: ["Bebidas"], subcategoria: "Energéticos" },
      { id: "bebidas-zero", label: "Zero Álcool", icon: Ban, dbCategories: ["Cervejas"], subcategoria: ["Zero Álcool", "Cerveja Zero"] },
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
      { id: "petiscos-porcoes", label: "Porções", icon: CookingPot, dbCategories: ["Petiscos"], subcategoria: ["Porções", "Petisco"] },
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
  onCategorySelect?: (categoryId: string, dbCategories?: string[], subcategoria?: string) => void;
  onProductSearch?: (searchTerm: string) => void;
  activeTab?: "menu" | "sacola" | "pedidos";
  onTabChange?: (tab: "menu" | "sacola" | "pedidos") => void;
}

/* ─── Hero Carousel Images (Cloudinary optimized) ─── */
const HERO_IMAGES = [
  "1_hyjdgf", "2_vtomud", "3_zv7ipt", "4_ztjc7u", "5_cvq3yf",
  "6_wl8l8e", "7_czccpk", "8_go2wqz", "9_o8aynt", "10_nkhfn5",
  "11_vc4yli", "12_ksbobb", "13_ekxenc", "14_dv4qkd", "15_pz5grg",
  "16_ojybsi", "17_oksskv", "18_tzhcdc", "19_hwlvsw", "20_qs8e2m",
  "Hero_Scroll_Loop_1620x1080_hisxc5",
];

const heroUrl = (id: string) =>
  `https://res.cloudinary.com/dvhkcemd0/image/upload/f_auto,q_auto:good,w_800/${id}.png`;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeApp({ onCategorySelect, onProductSearch, activeTab = "menu", onTabChange }: HomeAppProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSheet, setOpenSheet] = useState<CategoryDef | null>(null);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Shuffle once on mount — random order each visit, all 20 before repeating
  const shuffledImages = useMemo(() => shuffleArray(HERO_IMAGES), []);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slideshow every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % shuffledImages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [shuffledImages.length]);

  // Preload next 2 images for seamless transitions
  useEffect(() => {
    for (let offset = 1; offset <= 2; offset++) {
      const nextIdx = (currentSlide + offset) % shuffledImages.length;
      const img = new Image();
      img.src = heroUrl(shuffledImages[nextIdx]);
    }
  }, [currentSlide, shuffledImages]);

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
    const subCatStr = Array.isArray(sub.subcategoria) ? sub.subcategoria[0] : sub.subcategoria;
    onCategorySelect?.(sub.id, sub.dbCategories, subCatStr);
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className="home-shell">
      {/* ── Scrollable Content ── */}
      <div className="home-scroll">
        {/* ── Hero Fullscreen Slideshow ── */}
        <div className="home-hero-carousel" id="home-hero-carousel">
          {shuffledImages.map((id, i) => (
            <img
              key={id}
              src={heroUrl(id)}
              alt=""
              className={`home-hero-slide${i === currentSlide ? " home-hero-slide--active" : ""}`}
              loading={i < 3 ? "eager" : "lazy"}
              decoding={i < 3 ? "sync" : "async"}
              fetchPriority={i === 0 ? "high" : "low"}
            />
          ))}
          <div className="home-hero-overlay" />
          <div className="home-hero-content">
            <img
              src="/images/logo_bar.png"
              alt="Logo"
              className="home-hero-logo"
            />
          </div>
        </div>

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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setOpenSheet(null);
                }
              }}
            >
              <div className="sheet-handle" style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '14px auto', cursor: 'grab' }} />
              <div className="sheet-header">
                <div className="sheet-header-info">
                  {(() => { const SheetIcon = openSheet.icon; return <SheetIcon size={22} strokeWidth={2} style={{ color: '#FFFFFF' }} />; })()}
                  <h3 className="sheet-title">{openSheet.label}</h3>
                </div>
                <button className="sheet-close" onClick={() => setOpenSheet(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="sheet-list" style={{ paddingBottom: '30px' }}>
                {openSheet.subs.map((sub) => (
                  <button
                    key={sub.id}
                    className="sheet-item"
                    onClick={() => handleSubSelect(sub)}
                  >
                    {(() => { const SubIcon = sub.icon; return <SubIcon size={18} strokeWidth={1.8} style={{ color: '#9CA3AF', flexShrink: 0 }} />; })()}
                    <span className="sheet-item-label">{sub.label}</span>
                    <ChevronRight size={18} className="sheet-item-arrow" />
                  </button>
                ))}
                <button
                  className="sheet-item sheet-item-all"
                  onClick={() => {
                    setOpenSheet(null);
                    onCategorySelect?.(openSheet.id);
                  }}
                >
                  <ClipboardList size={18} strokeWidth={1.8} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                  <span className="sheet-item-label">Ver tudo</span>
                  <ChevronRight size={18} className="sheet-item-arrow" />
                </button>
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
