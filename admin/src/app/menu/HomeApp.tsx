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
  Package,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

/* ─── Layout Toggle: set to false to revert to original grid cards ─── */
const USE_LIST_VIEW = true;

const CATEGORIES: CategoryDef[] = [
  {
    id: "cervejas",
    label: "Cervejas",
    subtitle: "Long Necks & Garrafas",
    icon: Beer,
    image: "https://res.cloudinary.com/dvhkcemd0/image/upload/f_auto,q_auto,w_400/v1774444444/Cervejas_1080px_2_thjyhf.png",
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
    image: "https://res.cloudinary.com/dvhkcemd0/image/upload/f_auto,q_auto,w_400/v1774445206/drinks_jxg1vr.png",
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
    image: "https://res.cloudinary.com/dvhkcemd0/image/upload/f_auto,q_auto,w_400/v1774445605/Vinhos_1080px_unfpaw.png",
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
    image: "/images/nao_alcoolicos_thumb_1774554364537.png",
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
    image: "https://res.cloudinary.com/dvhkcemd0/image/upload/f_auto,q_auto,w_400/v1774445935/sobremesa_nv2je8.png",
    itemCount: 3,
    subs: [],
  },
  {
    id: "diversos",
    label: "Diversos",
    subtitle: "Gelo, Balas & Utilidades",
    icon: Package,
    image: "/images/diversos_thumb_1774554400887.png",
    itemCount: 4,
    subs: [
      { id: "div-diversos", label: "Diversos", icon: Package, dbCategories: ["Diversos"], subcategoria: "Diversos" },
      { id: "div-balas", label: "Balas", icon: Star, dbCategories: ["Diversos"], subcategoria: "Balas" },
    ],
  },
  {
    id: "danos",
    label: "Danos",
    subtitle: "Vidros & Copos Quebrados",
    icon: AlertTriangle,
    image: "/images/danos_thumb_1774554384902.png",
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
  onProductSearch?: (searchTerm: string, productId?: string) => void;
  activeTab?: "menu" | "sacola" | "pedidos";
  onTabChange?: (tab: "menu" | "sacola" | "pedidos") => void;
  configPromise?: Promise<Record<string, any> | null> | null;
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
  `https://res.cloudinary.com/dvhkcemd0/image/upload/f_auto,q_auto:good,w_600/${id}.png`;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeApp({ onCategorySelect, onProductSearch, activeTab = "menu", onTabChange, configPromise }: HomeAppProps) { 
    const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [openSheet, setOpenSheet] = useState<CategoryDef | null>(null);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [showPromo, setShowPromo] = useState(false);

  // Fetch global settings (promo, singer, couvert)
  useEffect(() => {
    async function fetchConfig() {
      const data = configPromise ? await configPromise : (await supabase.from("configuracoes").select("*").limit(1).single()).data;
      if (data) {
        setConfig(data);
        const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

        const getSaoPauloDateStr = (date: Date) => {
          const formatter = new Intl.DateTimeFormat("en-ZA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          });
          return formatter.format(date).replace(/\//g, "-");
        };

        // ── NEW: Check programacao_semanal for today's entry ──
        let hasNewPromos = false;
        const progSemanal = data.programacao_semanal as unknown as Array<{
          data: string;
          inicio?: string;
          fim?: string;
          atracoes?: string[];
          promocoes?: Array<{
             imagem_url?: string;
             titulo?: string;
             inicio?: string;
             fim?: string;
          }>;
        }>;

        if (Array.isArray(progSemanal) && progSemanal.length > 0) {
          const todayStr = getSaoPauloDateStr(new Date());
          const todayEntry = progSemanal.find((entry) => entry.data === todayStr);

          if (todayEntry) {
            const start = todayEntry.inicio ? new Date(todayEntry.inicio) : null;
            const end = todayEntry.fim ? new Date(todayEntry.fim) : null;
            const isTimeActive = (!start || nowSP >= start) && (!end || nowSP <= end);

            if (isTimeActive) {
              // Merge programacao_semanal data into config for consumption
              const weekPromos = (todayEntry.promocoes || []).filter((p) => p.imagem_url || p.titulo);
              const weekAtracoes = (todayEntry.atracoes || []).filter(Boolean);

              const configObj: Record<string, any> = { ...data };

              if (weekPromos.length > 0) {
                // Inject start/end times from the day entry into each promo
                const promosWithTimes = weekPromos.map((p) => ({
                  ...p,
                  inicio: todayEntry.inicio,
                  fim: todayEntry.fim,
                }));
                configObj._weekPromos = promosWithTimes;
                hasNewPromos = true;
              }

              if (weekAtracoes.length > 0) {
                configObj._weekAtracoes = weekAtracoes;
                configObj._weekAtracaoInicio = todayEntry.inicio;
                configObj._weekAtracaoFim = todayEntry.fim;
              }

              setConfig(configObj);
            }
          }

          // Auto-clean expired days
          const todayClean = getSaoPauloDateStr(new Date());
          const remaining = progSemanal.filter((entry) => entry.data >= todayClean);
          if (remaining.length < progSemanal.length) {
            // @ts-expect-error JSON compatibility from strictly typed array
            await supabase.from("configuracoes").update({ programacao_semanal: remaining as unknown }).eq("id", "global");
          }
        }

        // ── LEGACY: Check old promos array (fallback) ──
        const configPromocoes = data.promocoes as unknown as Array<{ imagem_url?: string; inicio?: string; fim?: string; }>;
        if (!hasNewPromos && data.promocao_ativa && Array.isArray(configPromocoes) && configPromocoes.length > 0) {
          const activeOnes: any[] = [];
          const hasExpired = configPromocoes.some((p) => {
            if (!p.imagem_url) return false;
            const start = p.inicio ? new Date(p.inicio) : null;
            const end = p.fim ? new Date(p.fim) : null;
            const isActive = (!start || nowSP >= start) && (!end || nowSP <= end);
            if (isActive) activeOnes.push(p);
            return end && nowSP > end;
          });

          if (hasExpired) {
            const rem = configPromocoes.filter((p) => {
              const end = p.fim ? new Date(p.fim) : null;
              return !end || nowSP <= end;
            });
            await supabase.from("configuracoes").update({
              promocoes: rem,
              promocao_ativa: rem.length > 0,
            }).eq("id", "global");
            data.promocoes = rem;
            data.promocao_ativa = rem.length > 0;
            setConfig({ ...data });
          }

          if (activeOnes.length > 0 && !sessionStorage.getItem('promoVisto')) {
            setShowPromo(true);
            sessionStorage.setItem('promoVisto', 'true');
          }
        }

        // Show promo modal for new system
        if (hasNewPromos && !sessionStorage.getItem('promoVisto')) {
          setShowPromo(true);
          sessionStorage.setItem('promoVisto', 'true');
        }
      }
    }
    fetchConfig();
  }, []);

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

  // Preload only next image for seamless transition (saves bandwidth)
  useEffect(() => {
    const nextIdx = (currentSlide + 1) % shuffledImages.length;
    const img = new Image();
    img.src = heroUrl(shuffledImages[nextIdx]);
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
  const allProductsCache = useRef<any[]>([]);
  const catMapCache = useRef<Record<string, string>>({});
  useEffect(() => {
    import("./MenuApp");
    // Pre-fetch all products + categories for ultra-fast fuzzy search
    async function fetchSearchDeps() {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, nome, slug, categoria_id, imagem_url, subcategoria")
          .eq("disponivel", true),
        supabase.from("categorias").select("id, nome"),
      ]);
      if (prodRes.data) allProductsCache.current = prodRes.data as unknown as any[];
      if (catRes.data) {
        const map: Record<string, string> = {};
        catRes.data.forEach((c) => { map[c.id] = c.nome; });
        catMapCache.current = map;
      }

      // ── CAMADA 1: Persist to global cache for MenuApp instant mount ──
      if (prodRes.data && catRes.data) {
        (window as any).__menuDataCache = {
          products: prodRes.data,
          catMap: catMapCache.current,
          timestamp: Date.now(),
        };
      }
    }
    fetchSearchDeps();
  }, []);

  // ── CAMADA 2: Preload category images before transition ──
  const preloadCategoryImages = useCallback((dbCategories: string[]) => {
    const products = allProductsCache.current;
    const catMap = catMapCache.current;
    if (!products.length || !Object.keys(catMap).length) return;

    const catNamesLower = dbCategories.map(c => c.toLowerCase().trim());
    const matching = products.filter(p => {
      const catName = catMap[p.categoria_id];
      return catName && catNamesLower.includes(catName.toLowerCase().trim());
    });

    // Preload first 6 images using optimized Cloudinary URL (AVIF for smallest size)
    matching.slice(0, 6).forEach(p => {
      if (p.imagem_url && p.imagem_url.includes('res.cloudinary.com')) {
        const optimized = p.imagem_url.replace('/upload/', '/upload/f_avif,q_auto,w_300/');
        const img = new Image();
        img.src = optimized;
      }
    });
  }, []);

  // Debounced product search — matches nome, subcategoria e categoria (ex: "Sucos", "Energéticos")
  const searchProducts = useCallback((query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const q = query.toLowerCase().trim();
      const qNoSpace = q.replace(/\s+/g, "");

      const matches = allProductsCache.current.filter(p => {
        const nome      = String(p.nome         || "").toLowerCase();
        const sub       = String(p.subcategoria || "").toLowerCase();
        const catNome   = String(catMapCache.current[p.categoria_id] || "").toLowerCase();
        const nNoSpace  = nome.replace(/\s+/g, "");
        const sNoSpace  = sub.replace(/\s+/g, "");
        const cNoSpace  = catNome.replace(/\s+/g, "");

        return (
          nome.includes(q)    || nNoSpace.includes(qNoSpace) ||
          sub.includes(q)     || sNoSpace.includes(qNoSpace) ||
          catNome.includes(q) || cNoSpace.includes(qNoSpace)
        );
      }).slice(0, 10);

      setSearchResults(
        matches.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          slug: p.slug,
          categoria: catMapCache.current[p.categoria_id] || "",
          imagem_url: p.imagem_url,
        }))
      );
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
    onProductSearch?.(product.nome, product.id);
  };

  const filteredCategories = searchQuery.trim().length >= 2
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CATEGORIES;

  // DB category names by macro-category ID (mirrors page.tsx CATEGORY_MAP)
  const PRELOAD_MAP: Record<string, string[]> = {
    cervejas: ["Cervejas"], drinks: ["Drinks", "Gins"],
    destilados: ["Destilados", "Whiskeys", "Vodkas", "Combos"], vinhos: ["Vinhos"],
    "nao-alcoolicos": ["Bebidas"], petiscos: ["Petiscos", "Pastéis"],
    grelha: ["Espetinhos", "Pratos & Executivos", "Guarnições"],
    sobremesas: ["Sobremesas"], diversos: ["Diversos"], danos: ["Danos"],
  };

  const handleCategoryTap = (cat: CategoryDef) => {
    if (cat.subs.length === 0) {
      // Preload with correct DB names
      preloadCategoryImages(PRELOAD_MAP[cat.id] || [cat.label]);
      onCategorySelect?.(cat.id);
    } else {
      // Preload the full macro-category images even before sub-selection
      preloadCategoryImages(PRELOAD_MAP[cat.id] || cat.subs.flatMap(s => s.dbCategories));
      setOpenSheet(cat);
    }
  };

  const handleSubSelect = (sub: SubCategory) => {
    setOpenSheet(null);
    // Preload images before navigating
    preloadCategoryImages(sub.dbCategories);
    const subCatStr = Array.isArray(sub.subcategoria) ? sub.subcategoria[0] : sub.subcategoria;
    onCategorySelect?.(sub.id, sub.dbCategories, subCatStr);
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  // ── Promo State & Logic ──
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Filter active promotions based on current time (SP timezone)
  const activePromos = useMemo(() => {
    const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    // ── NEW: Check programacao_semanal promos first ──
    if (config?._weekPromos && config._weekPromos.length > 0) {
      return config._weekPromos.filter((promo: any) => {
        if (!promo.imagem_url && !promo.titulo) return false;
        const start = promo.inicio ? new Date(promo.inicio) : null;
        const end = promo.fim ? new Date(promo.fim) : null;
        return (!start || nowSP >= start) && (!end || nowSP <= end);
      });
    }

    // ── LEGACY: fallback to old promos ──
    if (!config?.promocao_ativa || !config?.promocoes || !Array.isArray(config.promocoes)) return [];
    return config.promocoes.filter((promo: any) => {
      if (!promo.imagem_url) return false;
      const start = promo.inicio ? new Date(promo.inicio) : null;
      const end = promo.fim ? new Date(promo.fim) : null;
      return (!start || nowSP >= start) && (!end || nowSP <= end);
    });
  }, [config]);

  // Adjust current index if active promos change (e.g., config updates)
  useEffect(() => {
    if (activePromos.length > 0 && currentPromoIndex >= activePromos.length) {
      setCurrentPromoIndex(0);
    }
  }, [activePromos, currentPromoIndex]);


  const nextPromo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPromoIndex((prev) => (prev + 1) % activePromos.length);
  };

  const prevPromo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPromoIndex((prev) => (prev - 1 + activePromos.length) % activePromos.length);
  };


  return (
    <div className="home-shell">
      {/* ── Scrollable Content ── */}
      <div className="home-scroll">
        {/* ── Hero Fullscreen Slideshow (virtualized: only 3 slides in DOM) ── */}
        <div className="home-hero-carousel" id="home-hero-carousel">
          {(() => {
            const len = shuffledImages.length;
            const prevIdx = (currentSlide - 1 + len) % len;
            const nextIdx = (currentSlide + 1) % len;
            const visibleSlides = [
              { idx: prevIdx, id: shuffledImages[prevIdx] },
              { idx: currentSlide, id: shuffledImages[currentSlide] },
              { idx: nextIdx, id: shuffledImages[nextIdx] },
            ];
            return visibleSlides.map(({ idx, id }) => (
              <img
                key={id}
                src={heroUrl(id)}
                alt=""
                className={`home-hero-slide${idx === currentSlide ? " home-hero-slide--active" : ""}`}
                loading="eager"
                decoding="async"
                fetchPriority={idx === currentSlide ? "high" : "low"}
              />
            ));
          })()}
          <div className="home-hero-overlay" />
          <div className="home-hero-content">
            <img
              src="/images/logo_bar.png"
              alt="Logo"
              className="home-hero-logo"
            />
          </div>
        </div>

        {/* ── Singer Marquee (NEW: reads from programacao_semanal first, fallback to old fields) ── */}
        {(() => {
          const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
          let atracoes: string[] = [];

          // NEW: Check programacao_semanal atracoes
          if (config?._weekAtracoes && config._weekAtracoes.length > 0) {
            const start = config._weekAtracaoInicio ? new Date(config._weekAtracaoInicio) : null;
            const end = config._weekAtracaoFim ? new Date(config._weekAtracaoFim) : null;
            if ((!start || now >= start) && (!end || now <= end)) {
              atracoes = config._weekAtracoes;
            }
          }

          // LEGACY: fallback to old cantor fields
          if (atracoes.length === 0 && config?.cantor_ativo && config?.cantor_nome) {
            const start = config.cantor_inicio ? new Date(config.cantor_inicio) : null;
            const end = config.cantor_fim ? new Date(config.cantor_fim) : null;
            if ((!start || now >= start) && (!end || now <= end)) {
              try {
                const parsed = JSON.parse(config.cantor_nome);
                atracoes = Array.isArray(parsed) && parsed.length > 0 ? parsed : [config.cantor_nome];
              } catch {
                atracoes = [config.cantor_nome];
              }
            }
          }

          if (atracoes.length === 0) return null;

          const repeatCount = Math.max(10, Math.ceil(20 / atracoes.length));
          const sequence = Array(repeatCount).fill(atracoes).flat();

          const textStyle = {
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '1px',
            color: '#FFFFFF',
            textShadow: 'none',
            whiteSpace: 'nowrap' as const
          };

          const renderAtracaoItem = (atracao: string, key: string) => {
            const cleanUrl = atracao.split('?')[0].toLowerCase();
            const isImage = atracao.startsWith('/') || 
                            ((atracao.startsWith('http://') || atracao.startsWith('https://')) && 
                             (cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.svg') || cleanUrl.endsWith('.gif') || atracao.includes('/storage/v1/object/')));
            
            if (isImage) {
              return (
                <img
                  key={key}
                  src={atracao}
                  alt="Logo Atração"
                  style={{
                    height: '36px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'inline-block',
                    verticalAlign: 'middle'
                  }}
                />
              );
            }
            return <span key={key} style={textStyle}>{atracao}</span>;
          };

          return (
            <div style={{
              width: '100vw',
              marginLeft: '-16px',
              background: '#000000',
              overflow: 'hidden',
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              zIndex: 25,
              marginBottom: '28px',
            }}>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes marqueeSeamless { 
                  0% { transform: translateX(0%); } 
                  100% { transform: translateX(-50%); } 
                }
              `}} />
              <div style={{
                display: 'flex',
                width: 'max-content',
                animation: 'marqueeSeamless 80s linear infinite',
              }}>
                <div style={{ display: 'flex', gap: '40px', paddingRight: '40px', alignItems: 'center' }}>
                  {sequence.map((atracao, i) => renderAtracaoItem(atracao, `a-${i}`))}
                </div>
                <div style={{ display: 'flex', gap: '40px', paddingRight: '40px', alignItems: 'center' }} aria-hidden="true">
                  {sequence.map((atracao, i) => renderAtracaoItem(atracao, `b-${i}`))}
                </div>
              </div>
            </div>
          );
        })()}

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

            {/* ═══ LIST VIEW: Horizontal Premium Cards ═══ */}
            {USE_LIST_VIEW ? (
              <motion.div
                className="home-list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {filteredCategories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    className="home-list-card"
                    variants={cardVariants}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryTap(cat)}
                  >
                    <div className="hlc-img-wrap">
                      <img
                        src={cat.image}
                        alt={cat.label}
                        loading="eager"
                        decoding="async"
                        className="hlc-img"
                      />
                    </div>
                    <div className="hlc-body">
                      <div className="hlc-title-row">
                        <h3 className="hlc-title">{cat.label}</h3>
                      </div>
                      <p className="hlc-subtitle">
                        {cat.subs.length > 0
                          ? cat.subs.map(s => s.label).join(', ')
                          : cat.subtitle}
                      </p>
                      <span className="hlc-count">{cat.itemCount} itens</span>
                    </div>
                    <ChevronRight size={20} className="hlc-arrow" />
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              /* ═══ GRID VIEW: Original 2-Column Cards ═══ */
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
                        loading="eager"
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
            )}
          </>
        )}

        {/* ── Branding ── */}
        <div className="intelflux-watermark">
          intelflux
        </div>

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

      {/* ── Promo Modal Overlay ── */}
      <AnimatePresence>
        {showPromo && activePromos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowPromo(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              cursor: 'pointer',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x > 50 || velocity.x > 200) prevPromo(e as any);
                else if (offset.x < -50 || velocity.x < -200) nextPromo(e as any);
              }}
              style={{ 
                position: 'relative', 
                maxWidth: '320px', 
                width: '100%',
                background: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Navigation Arrows */}
              {activePromos.length > 1 && (
                <>
                  <button
                    onClick={prevPromo}
                    style={{
                      position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', zIndex: 20, cursor: 'pointer',
                      color: '#111827'
                    }}
                  >
                    <ChevronRight size={24} color="#111827" style={{ transform: 'rotate(180deg)' }} />
                  </button>
                  <button
                    onClick={nextPromo}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', zIndex: 20, cursor: 'pointer',
                      color: '#111827'
                    }}
                  >
                    <ChevronRight size={24} color="#111827" />
                  </button>
                </>
              )}

              {/* Indicator Dots */}
              {activePromos.length > 1 && (
                <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 20 }}>
                  {activePromos.map((_: any, idx: number) => (
                    <div key={idx} style={{
                      width: currentPromoIndex === idx ? '18px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: currentPromoIndex === idx ? '#16a34a' : 'rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }} />
                  ))}
                </div>
              )}

              {/* ── Title Header ── */}
              {activePromos[currentPromoIndex]?.titulo && (
                <div style={{ padding: '18px 44px 0', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#111827', lineHeight: '1.2', letterSpacing: '-0.3px' }}>
                    {activePromos[currentPromoIndex].titulo}
                  </h3>
                </div>
              )}

              {/* ── Image (tapping navigates to product) ── */}
              <div
                onClick={() => {
                  if (activePromos[currentPromoIndex]?.titulo) {
                    const term = activePromos[currentPromoIndex].titulo.replace(/^Promoção:\s*/i, '').trim();
                    onProductSearch?.(term);
                  }
                  setShowPromo(false);
                }}
                style={{ width: '100%', aspectRatio: '1 / 1', background: '#ffffff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: activePromos[currentPromoIndex]?.titulo ? 'pointer' : 'default' }}
              >
                <img
                  src={activePromos[currentPromoIndex]?.imagem_url}
                  alt={activePromos[currentPromoIndex]?.titulo || "Promoção do Dia"}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* ── Price (big typographic, green, no background) ── */}
              {activePromos[currentPromoIndex]?.preco && (() => {
                const [intPart, centPart] = Number(activePromos[currentPromoIndex].preco)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  .split(',');
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 24px 24px', gap: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a', lineHeight: 1, marginBottom: '6px' }}>R$</span>
                    <span style={{ fontSize: '56px', fontWeight: '900', color: '#16a34a', lineHeight: 1, letterSpacing: '-3px' }}>{intPart}</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a', lineHeight: 1, marginBottom: '6px' }}>,{centPart}</span>
                  </div>
                );
              })()}

              {/* ── Rodapé ── */}
              {activePromos[currentPromoIndex]?.rodape && (
                <div style={{ padding: '0 20px 32px', textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.2px' }}>
                    {activePromos[currentPromoIndex].rodape}
                  </p>
                </div>
              )}

              {/* ── Close Button ── */}
              <button
                onClick={() => setShowPromo(false)}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.07)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 30,
                }}
              >
                <X size={18} color="#111827" />
              </button>
            </motion.div>
          </motion.div>
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
