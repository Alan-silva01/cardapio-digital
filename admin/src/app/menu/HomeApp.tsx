"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  ShoppingCart,
  User,
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
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─── Subcategory Definitions ─── */
interface SubCategory {
  id: string;
  label: string;
  emoji: string;
  dbCategories: string[];
}

interface CategoryDef {
  id: string;
  label: string;
  subtitle: string;
  emoji: string;
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
    emoji: "🍺",
    icon: Beer,
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80",
    itemCount: 14,
    subs: [
      { id: "cervejas-all", label: "Todas as Cervejas", emoji: "🍻", dbCategories: ["Cervejas"] },
      { id: "cervejas-premium", label: "Premium & Importadas", emoji: "⭐", dbCategories: ["Cervejas"] },
      { id: "cervejas-zero", label: "Sem Álcool", emoji: "0️⃣", dbCategories: ["Cervejas"] },
    ],
  },
  {
    id: "drinks",
    label: "Drinks",
    subtitle: "Coquetéis & Shots",
    emoji: "🍹",
    icon: Martini,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
    itemCount: 7,
    subs: [
      { id: "drinks-all", label: "Todos os Drinks", emoji: "🍸", dbCategories: ["Drinks"] },
      { id: "drinks-gins", label: "Gins", emoji: "🫒", dbCategories: ["Gins"] },
      { id: "drinks-coqueteis", label: "Coquetéis", emoji: "🍹", dbCategories: ["Drinks"] },
    ],
  },
  {
    id: "destilados",
    label: "Destilados",
    subtitle: "Garrafas, Doses & Combos",
    emoji: "🥃",
    icon: GlassWater,
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80",
    itemCount: 9,
    subs: [
      { id: "dest-whiskeys", label: "Whiskeys", emoji: "🥃", dbCategories: ["Whiskeys"] },
      { id: "dest-vodkas", label: "Vodkas", emoji: "🧊", dbCategories: ["Vodkas"] },
      { id: "dest-gins", label: "Gins", emoji: "🫒", dbCategories: ["Gins"] },
      { id: "dest-outros", label: "Licores & Outros", emoji: "🍷", dbCategories: ["Destilados"] },
      { id: "dest-combos", label: "Combos", emoji: "🎉", dbCategories: ["Combos"] },
    ],
  },
  {
    id: "vinhos",
    label: "Vinhos",
    subtitle: "Tintos, Brancos & Rosés",
    emoji: "🍷",
    icon: Wine,
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
    itemCount: 13,
    subs: [
      { id: "vinhos-all", label: "Todos os Vinhos", emoji: "🍷", dbCategories: ["Vinhos"] },
      { id: "vinhos-espumante", label: "Espumantes", emoji: "🥂", dbCategories: ["Vinhos"] },
    ],
  },
  {
    id: "nao-alcoolicos",
    label: "Sem Álcool",
    subtitle: "Ice, Beats & Energéticos",
    emoji: "🥤",
    icon: Citrus,
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80",
    itemCount: 11,
    subs: [
      { id: "bebidas-all", label: "Todas as Bebidas", emoji: "🥤", dbCategories: ["Bebidas"] },
      { id: "bebidas-ice", label: "Ice", emoji: "🧊", dbCategories: ["Bebidas"] },
      { id: "bebidas-beats", label: "Skol Beats", emoji: "🎵", dbCategories: ["Bebidas"] },
    ],
  },
  {
    id: "petiscos",
    label: "Petiscos",
    subtitle: "Porções & Tábuas",
    emoji: "🍟",
    icon: CookingPot,
    image: "/images/petiscos.png",
    itemCount: 5,
    subs: [
      { id: "petiscos-all", label: "Todos os Petiscos", emoji: "🍖", dbCategories: ["Petiscos"] },
      { id: "petiscos-pasteis", label: "Pastéis", emoji: "🥟", dbCategories: ["Pastéis"] },
    ],
  },
  {
    id: "grelha",
    label: "Da Grelha",
    subtitle: "Espetos, Pratos & Executivos",
    emoji: "🥩",
    icon: Flame,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    itemCount: 8,
    subs: [
      { id: "grelha-espetinhos", label: "Espetinhos", emoji: "🍢", dbCategories: ["Espetinhos"] },
      { id: "grelha-pratos", label: "Pratos & Executivos", emoji: "🍽️", dbCategories: ["Pratos & Executivos"] },
      { id: "grelha-guarnicoes", label: "Guarnições", emoji: "🥗", dbCategories: ["Guarnições"] },
    ],
  },
  {
    id: "sobremesas",
    label: "Sobremesas",
    subtitle: "Pudim & Brownie",
    emoji: "🍰",
    icon: IceCreamCone,
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80",
    itemCount: 3,
    subs: [],
  },
];

/* ─── Animations ─── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

const heroVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 24, delay: 0.05 },
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
    onCategorySelect?.(sub.id, sub.dbCategories);
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className="home-shell">
      {/* ── Top Bar ── */}
      <header className="home-topbar">
        <div>
          <p className="home-greeting">Bem-vindo ao</p>
          <h1 className="home-brand">Seu Manel</h1>
        </div>
      </header>

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

      {/* ── Scrollable Content ── */}
      <div className="home-scroll">

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
            {/* Video Banner */}
            <motion.div
              className="home-video-card"
              variants={heroVariants}
              initial="hidden"
              animate="show"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                poster="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80"
                className="home-video"
              />
              <div className="home-video-overlay">
                <span className="home-video-badge">🔥 Novidades</span>
                <p className="home-video-text">Conheça nossos drinks especiais</p>
              </div>
              {/* Dots on video banner */}
              <div className="hc-dots">
                <span className="hc-dot hc-dot-active" />
                <span className="hc-dot" />
                <span className="hc-dot" />
                <span className="hc-dot" />
              </div>
            </motion.div>

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
        <NavItem icon={ShoppingBag} label="Sacola" active={activeTab === "sacola"} onTap={() => onTabChange?.("sacola")} />
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
              transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
            >
              <div className="sheet-handle" />
              <div className="sheet-header">
                <div className="sheet-header-info">
                  <span className="sheet-emoji">{openSheet.emoji}</span>
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
                    transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 25 }}
                    onClick={() => handleSubSelect(sub)}
                  >
                    <span className="sheet-item-emoji">{sub.emoji}</span>
                    <span className="sheet-item-label">{sub.label}</span>
                    <ChevronRight size={18} className="sheet-item-arrow" />
                  </motion.button>
                ))}
                <motion.button
                  className="sheet-item sheet-item-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: openSheet.subs.length * 0.05, type: "spring" as const, stiffness: 300, damping: 25 }}
                  onClick={() => {
                    setOpenSheet(null);
                    onCategorySelect?.(openSheet.id);
                  }}
                >
                  <span className="sheet-item-emoji">📋</span>
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
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onTap: () => void;
}) {
  return (
    <motion.button
      className={`home-nav-item ${active ? "home-nav-active" : ""}`}
      whileTap={{ scale: 0.85 }}
      onClick={onTap}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
      <span>{label}</span>
    </motion.button>
  );
}
