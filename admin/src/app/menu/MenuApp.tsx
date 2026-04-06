// @ts-nocheck

"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { countryFlags } from "@/lib/countryFlags";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowLeft, Loader2, Heart, Users, User, Droplet, Plus, Minus, Trash2, X, Bell, Receipt, MessageSquare, Clock, ChevronDown, Check, Home, ShoppingBag, ClipboardList } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

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

// Cloudinary URL optimizer: injects format/quality/width transforms
// Uses AVIF for ~50% smaller files vs WebP (all modern browsers support it)
const optimizeCloudinaryUrl = (url, width = 300) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    // Avoid double-transform: if already has transforms, skip
    if (url.includes('/upload/f_') || url.includes('/upload/q_') || url.includes('/upload/w_')) return url;
    return url.replace('/upload/', `/upload/f_avif,q_auto,w_${width}/`);
};

// LQIP: Generate ultra-tiny blur placeholder URL from Cloudinary (≈400 bytes with AVIF)
const getLqipUrl = (url) => {
    if (!url || !url.includes('res.cloudinary.com')) return null;
    // Strip existing transforms and add tiny blur
    const clean = url.replace(/\/upload\/[^/]*\//, '/upload/');
    return clean.replace('/upload/', '/upload/f_avif,q_auto:low,w_30,e_blur:800/');
};

// HEART BURST PARTICLE COMPONENT
const HeartParticle = ({ x, y, onComplete }) => {
    return (
        <motion.div
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
                opacity: 0,
                scale: [0, 1.5, 1],
                x: (Math.random() - 0.5) * 150,
                y: -Math.random() * 150 - 50,
                rotate: (Math.random() - 0.5) * 45
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={onComplete}
            style={{
                position: 'fixed',
                left: x,
                top: y,
                zIndex: 9999,
                pointerEvents: 'none',
                color: '#444'
            }}
        >
            <Heart size={16} fill="#444" />
        </motion.div>
    );
};

// OPTIMIZED IMAGE: Shows blur placeholder instantly, then fades in full image
const OptimizedImage = ({ src, alt, style = {}, isUnavailable = false }: { src: string; alt: string; style?: React.CSSProperties; isUnavailable?: boolean }) => {
    // Check browser cache synchronously to avoid flash for cached images
    const [loaded, setLoaded] = useState(() => {
        if (typeof window === 'undefined') return false;
        const probe = new window.Image();
        probe.src = src;
        return probe.complete && probe.naturalWidth > 0;
    });
    const lqip = getLqipUrl(src);
    const prevSrc = useRef(src);

    // Only reset loaded state when src actually changes
    if (src !== prevSrc.current) {
        prevSrc.current = src;
        // Synchronous cache check for new src
        const probe = new window.Image();
        probe.src = src;
        if (probe.complete && probe.naturalWidth > 0) {
            if (!loaded) setLoaded(true);
        } else {
            if (loaded) setLoaded(false);
        }
    }

    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            {/* LQIP blur layer — shows instantly */}
            {lqip && !loaded && (
                <img
                    src={lqip}
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        maxHeight: '90%',
                        width: 'auto',
                        objectFit: 'contain',
                        filter: 'blur(12px) saturate(1.2)',
                        transform: 'scale(1.05)',
                        opacity: 0.7,
                        zIndex: 1,
                        ...style,
                    }}
                />
            )}
            {/* Full-res image — fades in when loaded */}
            <img
                src={src}
                alt={alt}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onLoad={() => { if (!loaded) setLoaded(true); }}
                style={{
                    maxHeight: '90%',
                    width: 'auto',
                    objectFit: 'contain',
                    zIndex: 2,
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.2s ease-in',
                    filter: isUnavailable ? 'blur(1.5px) grayscale(0.4)' : 'none',
                    ...style,
                }}
            />
        </div>
    );
};


const App = ({ filterCategories = null, filterSubcategoria = null, searchProductName = null, onBack = null, isActive = true, activeTab = 'menu', onTabChange = null, isClosed = false }) => {
    const [products, setProducts] = useState([]);
    const allProductsRef = useRef([]);
    const [loading, setLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const prevFilterRef = useRef({ filterCategories, filterSubcategoria, searchProductName });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 = right, -1 = left
    const [isInternalSpin, setIsInternalSpin] = useState(false); // true when clicking a flavor button
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [cart, setCart] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('@Menu-Cart');
                if (saved) return JSON.parse(saved);
            } catch (e) { console.error('Error parsing cart localStorage', e) }
        }
        return {};
    }); // { productId: quantity }
    const [pendingQty, setPendingQty] = useState(1); // local qty before adding to cart
    const [flyingItems, setFlyingItems] = useState([]); // for fly-to-cart animation
    const [heartParticles, setHeartParticles] = useState([]); // for heart burst effect
    const [wineGlassImages, setWineGlassImages] = useState({}); // { tinto: url, branco: url, rose: url }
    const [isCartOpen, setIsCartOpen] = useState(false); // Controls the cart overlay
    const [isCheckingOut, setIsCheckingOut] = useState(false); // Loading state for checkout
    const [orderSuccess, setOrderSuccess] = useState(false); // Success screen after order
    const [config, setConfig] = useState(null);
    const [showPromo, setShowPromo] = useState(false);
    const cartIconRef = useRef(null);
    const heroTitleRef = useRef(null);

    // AUTO-FIT: shrink hero title font until it fits on 1 line
    useEffect(() => {
        const el = heroTitleRef.current;
        if (!el) return;
        // Reset to max size first
        el.style.fontSize = '24px';
        let size = 24;
        while (el.scrollWidth > el.clientWidth && size > 12) {
            size -= 0.5;
            el.style.fontSize = `${size}px`;
        }
    }, [currentIndex, products]);

    // PREFETCH: preload adjacent product images + flags on swipe
    useEffect(() => {
        if (!products.length) return;
        const offsets = [-2, -1, 1, 2];
        offsets.forEach(offset => {
            const idx = (currentIndex + offset + products.length) % products.length;
            const p = products[idx];
            if (p?.imageUrl) {
                const img = new Image();
                img.src = p.imageUrl;
            }
            if (p?.flagUrl) {
                const img = new Image();
                img.src = p.flagUrl;
            }
        });
    }, [currentIndex, products]);

    // NEW COMANDAS STATE
    const [pessoaAtiva, setPessoaAtiva] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('@Menu-PessoaAtiva') || '') : '');
    const [isPeopleDrawerOpen, setIsPeopleDrawerOpen] = useState(false);
    const [pessoasNaMesa, setPessoasNaMesa] = useState([]);
    const [isFetchingPessoas, setIsFetchingPessoas] = useState(false);
    const [novaPessoaNome, setNovaPessoaNome] = useState('');
    const [isAddMode, setIsAddMode] = useState(false);
    const [isCartPending, setIsCartPending] = useState(false);
    const [pendingProductToAdd, setPendingProductToAdd] = useState<Record<string, any>>(null);

    // CART TABS & HISTORY
    const [cartTab, setCartTab] = useState('carrinho'); // 'carrinho' | 'pedidos'
    const [itemObservations, setItemObservations] = useState({}); // { cartKey: 'sem cebola' }
    const [obsOpenFor, setObsOpenFor] = useState(null); // which cart item has obs input open
    const [orderHistory, setOrderHistory] = useState<Record<string, any>[]>([]);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    // SERVICE BUTTONS
    const [garcomCalled, setGarcomCalled] = useState(false);
    const [contaCalled, setContaCalled] = useState(false);
    const [garcomCooldown, setGarcomCooldown] = useState(false);
    const [contaCooldown, setContaCooldown] = useState(false);

    // REACT TO BOTTOM NAV TAB CHANGES
    useEffect(() => {
        if (activeTab === 'sacola') {
            setIsCartOpen(true);
            setCartTab('carrinho');
        } else if (activeTab === 'pedidos') {
            setIsCartOpen(true);
            setCartTab('pedidos');
        } else {
            setIsCartOpen(false);
        }
    }, [activeTab]);

    // REACT TO ESTABLISHMENT CLOSED
    useEffect(() => {
        if (isClosed) {
            setIsCartOpen(false);
            setIsPeopleDrawerOpen(false);
            setObsOpenFor(null);
            setIsCartPending(false);
        }
    }, [isClosed]);

    // PERSIST PERSON ON DEVICE
    useEffect(() => {
        if (pessoaAtiva) {
            localStorage.setItem('@Menu-PessoaAtiva', pessoaAtiva);
        } else {
            localStorage.removeItem('@Menu-PessoaAtiva');
        }
    }, [pessoaAtiva]);

    // PERSIST CART ON DEVICE
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('@Menu-Cart', JSON.stringify(cart));
            // Dispatch event for other components (like HomeApp) in the same window
            window.dispatchEvent(new Event('cartUpdated'));
        }
    }, [cart]);

    // FETCH EXISTING COMANDAS ON THIS TABLE
    const fetchPessoasNaMesa = useCallback(async (options = {}) => {
        const { autoSelect = false } = options;
        setIsFetchingPessoas(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('t');

            if (!token) return;

            const { data: mesaData } = await supabase.from('mesas').select('id, numero').eq('token', token).single();
            if (!mesaData) return;

            const { data: openComanda } = await supabase.from('comandas').select('id').eq('mesa_id', mesaData.id).eq('status', 'aberta').maybeSingle();
            if (!openComanda) {
                // No open comanda = fresh table, clear any stale pessoaAtiva
                setPessoasNaMesa([]);
                if (autoSelect) {
                    setPessoaAtiva('');
                }
                return;
            }

            const { data: pessoasData } = await supabase.from('pedidos').select('nome_pessoa').eq('comanda_id', openComanda.id);
            if (pessoasData) {
                let nomes = pessoasData.map(p => p.nome_pessoa).filter(n => n && n !== 'Cliente');
                nomes = [...new Set(nomes)];
                setPessoasNaMesa(nomes);

                if (autoSelect && nomes.length > 0) {
                    // Try to match localStorage hint first
                    const savedName = localStorage.getItem('@Menu-PessoaAtiva');
                    if (savedName && nomes.includes(savedName)) {
                        // localStorage name matches someone in the comanda — auto-select
                        setPessoaAtiva(savedName);
                    } else if (nomes.length === 1) {
                        // Only one person on the table — auto-select them
                        setPessoaAtiva(nomes[0]);
                    } else {
                        // Multiple people, no localStorage match — defer to cart open
                        setPessoaAtiva('');
                    }
                }
            }
        } catch (e) {
            console.error("Erro fetch Pessoas", e);
        } finally {
            setIsFetchingPessoas(false);
        }
    }, []);

    // AUTO-FETCH PEOPLE ON APP LOAD (DB-backed name recovery)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('t');
        if (token) {
            fetchPessoasNaMesa({ autoSelect: true });
        }
    }, [fetchPessoasNaMesa]);

    // REFRESH PEOPLE WHEN DRAWER OPENS
    useEffect(() => {
        if (isPeopleDrawerOpen) {
            fetchPessoasNaMesa();
            setIsAddMode(false);
            setNovaPessoaNome('');
        }
    }, [isPeopleDrawerOpen, fetchPessoasNaMesa]);

    const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    const currentProduct = products.length > 0 ? products[currentIndex] : null;

    // Function to handle opening the cart, checking for active person
    const handleOpenCartClick = useCallback(() => {
        if (!pessoaAtiva) {
            setIsCartPending(true);
            setIsPeopleDrawerOpen(true);
        } else {
            setCartTab('carrinho');
            setIsCartOpen(true);
            if (onTabChange) onTabChange('sacola');
        }
    }, [pessoaAtiva, onTabChange]);

    // Function to handle selecting an existing person
    const handlePessoaSelect = useCallback((nome) => {
        setPessoaAtiva(nome);
        if (isCartPending) {
            setIsCartPending(false);
            setCartTab('carrinho');
            setIsCartOpen(true);
            if (onTabChange) onTabChange('sacola');
        }
        setIsPeopleDrawerOpen(false);
    }, [isCartPending, onTabChange]);

    // Function to handle adding a new person
    const handlePessoaAdd = useCallback(async () => {
        if (!novaPessoaNome.trim()) return;

        const nomeFinal = novaPessoaNome.trim();
        // Check if the person already exists in the list (case-insensitive)
        if (pessoasNaMesa.some(p => p.toLowerCase() === nomeFinal.toLowerCase())) {
            alert('Essa pessoa já está na mesa.');
            return;
        }

        // Prepare to finalize UI regardless of DB success
        const finalizeUI = () => {
            setPessoaAtiva(nomeFinal);
            setIsPeopleDrawerOpen(false);
            if (isCartPending) {
                setIsCartPending(false);
                setCartTab('carrinho');
                setIsCartOpen(true);
                if (onTabChange) onTabChange('sacola');
            }
        };

        // Add to DB (pedidos table)
        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('t');

            if (!token) {
                console.warn("Mesa inválida ou não encontrada na URL. Modo teste local?");
                // Proceed with local state anyway
                finalizeUI();
                return;
            }

            const { data: mesaData, error: mesaErr } = await supabase
                .from('mesas')
                .select('id, numero')
                .eq('token', token)
                .single();
            if (mesaErr || !mesaData) throw new Error(`Mesa correspondente ao QRCode não encontrada.`);
            const mesaId = mesaData.id;
            const mesaNum = mesaData.numero;

            let comandaId;
            const { data: existingComanda } = await supabase
                .from('comandas')
                .select('id')
                .eq('mesa_id', mesaId)
                .eq('status', 'aberta')
                .maybeSingle();

            if (existingComanda) {
                comandaId = existingComanda.id;
            } else {
                const { data: newComanda, error: comandaErr } = await supabase
                    .from('comandas')
                    .insert({ mesa_id: mesaId, status: 'aberta', qtd_pessoas: 1 })
                    .select('id')
                    .single();
                if (comandaErr) throw comandaErr;
                comandaId = newComanda.id;
            }

            // Insert a dummy pedido to register the person's name
            const { error: pedidoErr } = await supabase
                .from('pedidos')
                .insert({
                    comanda_id: comandaId,
                    numero_mesa: mesaNum,
                    nome_pessoa: nomeFinal,
                    status: 'recebido', // Can be any status, it's just to register the name
                    total: 0, // No actual items yet
                });
            if (pedidoErr) throw pedidoErr;

            // Refresh the list of people
            await fetchPessoasNaMesa(); // Re-fetch to include the new person
            
            finalizeUI();
        } catch (error) {
            console.error('Erro ao adicionar pessoa no DB:', error);
            // Even on error (offline, no table, etc), let the user proceed locally
            // The hard block is at Checkout
            finalizeUI();
        }
    }, [novaPessoaNome, pessoasNaMesa, fetchPessoasNaMesa, isCartPending]);

    // CHECKOUT LOGIC — Secure: uses server-side RPC for price validation
    const handleCheckout = async () => {
        if (isClosed) return;
        if (Object.keys(cart).length === 0 || isCheckingOut) return;
        setIsCheckingOut(true);

        try {
            // 1. Get token from URL
            const params = new URLSearchParams(window.location.search);
            const token = params.get('t');

            if (!token) {
                alert("Mesa inválida ou não encontrada. Por favor, leia o QR Code novamente.");
                setIsCheckingOut(false);
                return;
            }

            // 2. Build secure cart items (only IDs and quantities — prices are validated server-side)
            const nomeFinal = pessoaAtiva || 'Cliente';
            const itensSeguro = [];

            Object.entries(cart).forEach(([key, qty]) => {
                const hasVariation = key.includes('-');
                const pid = hasVariation ? key.split('-')[0] : key;
                const varName = hasVariation ? key.split('-').slice(1).join('-') : null;
                const pModel = allProductsRef.current.find(p => p.id === pid);

                if (pModel) {
                    let varId = null;
                    if (hasVariation && pModel.variations && pModel.variations[varName]) {
                        varId = pModel.variations[varName].id;
                    }

                    itensSeguro.push({
                        produto_id: pid,
                        variacao_id: varId,
                        quantidade: qty,
                        observacao: itemObservations[key] || null,
                    });
                }
            });

            // 3. Call secure server-side checkout function
            const { data: result, error: rpcError } = await supabase
                .rpc('criar_pedido_seguro', {
                    p_mesa_token: token,
                    p_nome_pessoa: nomeFinal,
                    p_itens: itensSeguro,
                });

            if (rpcError) throw rpcError;

            // Check for business logic errors returned by the function
            if (result && result.error) {
                alert(result.error);
                setIsCheckingOut(false);
                if (result.closed) {
                    setIsCartOpen(false);
                }
                return;
            }

            // 4. Success! Clear cart and show success screen
            setCart({});
            setItemObservations({});
            setCartTab('pedidos');
            setIsCartOpen(false);
            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 4000);

            // Re-fetch history immediately
            fetchOrderHistory();

        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            alert('Erro ao enviar pedido. Tente novamente.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    // --- FETCH ORDER HISTORY ---
    const fetchOrderHistory = useCallback(async () => {
        if (!pessoaAtiva) return;
        setIsFetchingHistory(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('t');
            if (!token) return;

            // 1. Get Mesa ID
            const { data: mesaData } = await supabase.from('mesas').select('id').eq('token', token).single();
            if (!mesaData) return;

            // 2. Get Open Comanda
            const { data: comanda } = await supabase
                .from('comandas')
                .select('id')
                .eq('mesa_id', mesaData.id)
                .eq('status', 'aberta')
                .maybeSingle();
            
            if (!comanda) {
                setOrderHistory([]);
                return;
            }

            const { data: pedidos, error } = await supabase
                .from('pedidos')
                .select(`
                    id, 
                    criado_em, 
                    total, 
                    status,
                    itens_pedido (
                        id, nome_produto, nome_variacao, quantidade, preco_total, observacao
                    )
                `)
                .eq('comanda_id', comanda.id)
                .eq('nome_pessoa', pessoaAtiva)
                .order('criado_em', { ascending: false });

            if (error) {
                console.error("Error fetching history:", error);
            }

            setOrderHistory(pedidos || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsFetchingHistory(false);
        }
    }, [pessoaAtiva]);

    // Keep history updated when cart tab changes or active person changes
    useEffect(() => {
        if (cartTab === 'pedidos' || isCartOpen) {
            fetchOrderHistory();
        }
    }, [cartTab, isCartOpen, pessoaAtiva, fetchOrderHistory]);

    // Subscribe to order status updates (Realtime)
    useEffect(() => {
        if (!pessoaAtiva || !isCartOpen) return;
        
        const channel = supabase
            .channel('public:pedidos')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pedidos' },
                (payload) => {
                    // Update only if it's an order belonging to the current person
                    setOrderHistory(prev => prev.map(p => 
                        p.id === payload.new.id ? { ...p, status: payload.new.status } : p
                    ));
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [pessoaAtiva, isCartOpen]);


    // --- SERVICE BUTTONS HANDLERS ---
    const handleCallService = async (type) => { // 'garcom' | 'conta'
        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('t');
            if (!token) return;

            const isGarcom = type === 'garcom';
            
            // Set cooldown locally so users don't spam clicks
            if (isGarcom) {
                setGarcomCooldown(true);
                setTimeout(() => setGarcomCooldown(false), 30000); // 30s cooldown
            } else {
                setContaCooldown(true);
                setTimeout(() => setContaCooldown(false), 30000);
            }

            // Update mesa using secure RPC (only updates service flags)
            const { data: result, error } = await supabase
                .rpc('chamar_servico', {
                    p_mesa_token: token,
                    p_tipo: isGarcom ? 'garcom' : 'conta',
                });

            if (error) throw error;
            if (result && result.error) throw new Error(result.error);

            if (isGarcom) {
                setGarcomCalled(true);
                setTimeout(() => setGarcomCalled(false), 60000); // Visual reset after 1 min (backend reset by admin)
            } else {
                setContaCalled(true);
                setTimeout(() => setContaCalled(false), 60000);
            }
            
        } catch (error) {
            console.error(`Error calling ${type}:`, error);
        }
    };
    const fetchMenu = useCallback(async (isInitial = false) => {
        try {
            // ── FULL DATA CACHE: Skip ALL queries if enriched data already exists ──
            const fullCache = (window as unknown as Record<string, any>).__menuFullCache;
            if (isInitial && fullCache && (Date.now() - fullCache.timestamp < 120000)) {
                // Use cached enriched data directly — zero Supabase queries!
                allProductsRef.current = fullCache.enrichedProducts;
                if (fullCache.config) setConfig(fullCache.config);
                if (fullCache.wineGlassImages) setWineGlassImages(fullCache.wineGlassImages);

                const currentFilters = prevFilterRef.current.filterCategories;
                const currentSubcat = prevFilterRef.current.filterSubcategoria;
                const currentSearch = prevFilterRef.current.searchProductName;

                if (currentFilters && currentFilters.length > 0) {
                    const sanitizedFilters = currentFilters.map(f => f.normalize("NFC").toLowerCase().trim());
                    let filtered = fullCache.enrichedProducts.filter(p => p.category && sanitizedFilters.includes(p.category.normalize("NFC").toLowerCase().trim()));
                    if (currentSubcat) {
                        const targetSubs = Array.isArray(currentSubcat)
                            ? currentSubcat.map(s => s.normalize("NFC").toLowerCase().trim())
                            : [currentSubcat.normalize("NFC").toLowerCase().trim()];
                        filtered = filtered.filter(p => p.subcategoria && targetSubs.includes(p.subcategoria.normalize("NFC").toLowerCase().trim()));
                    }
                    setProducts(filtered);
                } else if (currentSearch) {
                    const term = currentSearch.toLowerCase().trim();
                    const termNoSpace = term.replace(/\s+/g, "");
                    const matchedProduct = fullCache.enrichedProducts.find(p => {
                        if (!p.name) return false;
                        const n = p.name.toLowerCase();
                        return n.includes(term) || n.replace(/\s+/g, "").includes(termNoSpace);
                    });
                    if (matchedProduct) {
                        const categoryProducts = fullCache.enrichedProducts.filter(p => p.category === matchedProduct.category);
                        setProducts(categoryProducts);
                        const targetIdx = categoryProducts.findIndex(p => p.id === matchedProduct.id);
                        setCurrentIndex(targetIdx !== -1 ? targetIdx : 0);
                    } else {
                        setProducts(fullCache.enrichedProducts);
                    }
                } else {
                    setProducts(fullCache.enrichedProducts);
                }
                setLoading(false);
                return; // Fully served from cache!
            }

            // ── CAMADA 1: Use cached data from HomeApp for instant first render ──
            const globalCache = (window as unknown as Record<string, any>).__menuDataCache;
            let catData, prodData, varData, wineData, configData;
            let catError = null, prodError = null, varError = null, wineError = null, configError = null;

            if (isInitial && globalCache && (Date.now() - globalCache.timestamp < 60000)) {
                // Partial cache hit — fetch products + rest ALL in parallel (single roundtrip)
                const [prodRes, varRes, wineRes, configRes] = await Promise.all([
                    supabase.from('produtos')
                        .select('id, categoria_id, nome, slug, descricao, imagem_url, disponivel, visivel_app, ordem, pais_origem, volume_ml, teor_alcolico, serve_pessoas, rating, curtidas, tipo_vinho, ml_taca, subcategoria, grupo_id_sabor, nome_curto_sabor, is_master_sabor')
                        .order('ordem', { ascending: true }),
                    supabase.from('variacoes_produto').select('*').eq('ativo', true).order('ordem', { ascending: true }),
                    supabase.from('tipos_vinho').select('tipo, imagem_taca_url'),
                    supabase.from('configuracoes').select('*').limit(1).single()
                ]);

                // Build catData from cached catMap
                catData = Object.entries(globalCache.catMap).map(([id, nome]) => ({ id, nome, icone: null }));
                prodData = prodRes.data; prodError = prodRes.error;
                varData = varRes.data; varError = varRes.error;
                wineData = wineRes.data; wineError = wineRes.error;
                configData = configRes.data; configError = configRes.error;
            } else {
                // Full fetch (normal path + Realtime refresh)
                const results = await Promise.all([
                    supabase.from('categorias').select('id, nome, icone').eq('ativo', true),
                    supabase.from('produtos')
                        .select('id, categoria_id, nome, slug, descricao, imagem_url, disponivel, visivel_app, ordem, pais_origem, volume_ml, teor_alcolico, serve_pessoas, rating, curtidas, tipo_vinho, ml_taca, subcategoria, grupo_id_sabor, nome_curto_sabor, is_master_sabor')
                        .order('ordem', { ascending: true }),
                    supabase.from('variacoes_produto').select('*').eq('ativo', true).order('ordem', { ascending: true }),
                    supabase.from('tipos_vinho').select('tipo, imagem_taca_url'),
                    supabase.from('configuracoes').select('*').limit(1).single()
                ]);
                catData = results[0].data; catError = results[0].error;
                prodData = results[1].data; prodError = results[1].error;
                varData = results[2].data; varError = results[2].error;
                wineData = results[3].data; wineError = results[3].error;
                configData = results[4].data; configError = results[4].error;
            }

            if (catError) throw catError;
            if (prodError) throw prodError;
            if (varError) throw varError;

            const catMap = catData.reduce((acc, cat) => {
                acc[cat.id] = cat.nome;
                return acc;
            }, {});
            const varMap = varData.reduce((acc, v) => {
                if (!acc[v.produto_id]) acc[v.produto_id] = [];
                acc[v.produto_id].push(v);
                return acc;
            }, {});

            if (configData) {
                setConfig(configData);
                // Handle Promo Logic natively on initial load
                if (isInitial && configData.promocao_ativa) {
                    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
                    const start = configData.promocao_inicio ? new Date(configData.promocao_inicio) : null;
                    const end = configData.promocao_fim ? new Date(configData.promocao_fim) : null;
                    const isInTimeWindow = (!start || now >= start) && (!end || now <= end);
                    
                    if (isInTimeWindow) {
                        const hasSeenPromo = sessionStorage.getItem('promoVisto');
                        if (!hasSeenPromo && configData.promocao_imagem_url) {
                            setShowPromo(true);
                            sessionStorage.setItem('promoVisto', 'true');
                        }
                    }
                }
            }

            let glassMapToPreload = null;
            if (!wineError && wineData) {
                const glassMap = {};
                wineData.forEach(w => { glassMap[w.tipo] = optimizeCloudinaryUrl(w.imagem_taca_url); });
                setWineGlassImages(glassMap);
                glassMapToPreload = glassMap;
            }

            let activePromosList = [];
            if (configData) {
                const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
                let hasNewPromos = false;

                if (configData.programacao_semanal && Array.isArray(configData.programacao_semanal)) {
                    const todayActive = configData.programacao_semanal.find(dia => {
                        const start = new Date(dia.inicio);
                        const end = new Date(dia.fim);
                        return now >= start && now <= end && dia.promocoes && dia.promocoes.length > 0;
                    });
                    if (todayActive) {
                        activePromosList = todayActive.promocoes;
                        hasNewPromos = true;
                    }
                }

                if (!hasNewPromos && configData.promocao_ativa && Array.isArray(configData.promocoes)) {
                    activePromosList = configData.promocoes.filter(p => {
                        const start = p.inicio ? new Date(p.inicio) : null;
                        const end = p.fim ? new Date(p.fim) : null;
                        return (!start || now >= start) && (!end || now <= end);
                    });
                }
            }

            // Reconstruct the data shape expected by the frontend
            const enrichedProducts = prodData.map(p => {
                const myVariants = varData.filter(v => v.produto_id === p.id);

                let matchingPromo = activePromosList.find(promo => {
                    if (promo.aplicar_grupo && p.grupo_id_sabor && promo.grupo_id_sabor === p.grupo_id_sabor) return true;
                    if (promo.produto_id === p.id) return true;
                    return false;
                });

                // Organize variants dict
                let varsDict = null;
                let defaultPrice = 0;
                let defaultOriginalPrice = null;

                if (myVariants.length > 0) {
                    varsDict = {};
                    myVariants.forEach(v => {
                        let priceToUse = v.preco;
                        let originalPrice = null;

                        if (matchingPromo && (!matchingPromo.variacao_id || matchingPromo.variacao_id === v.id) && matchingPromo.preco) {
                            priceToUse = Number(matchingPromo.preco);
                            originalPrice = v.preco;
                        }

                        varsDict[v.nome] = {
                            id: v.id,
                            price: priceToUse,
                            originalPrice: originalPrice,
                            stock: v.estoque,
                            imagem_url: v.imagem_url,
                            descricao: v.descricao
                        };
                    });
                    
                    const firstVariation = Object.values(varsDict)[0] as Record<string, any>;
                    defaultPrice = firstVariation.price;
                    defaultOriginalPrice = firstVariation.originalPrice;
                }

                // Visual properties linked by slug
                const categoryName = catMap[p.categoria_id] || 'Outros';

                return {
                    id: p.id,
                    slug: p.slug,
                    name: p.nome,
                    categoryId: p.categoria_id,
                    category: categoryName,
                    subcategoria: p.subcategoria || null,
                    description: p.descricao,
                    imageUrl: optimizeCloudinaryUrl(p.imagem_url),
                    price: defaultPrice,
                    originalPrice: defaultOriginalPrice,
                    variations: varsDict,
                    flagUrl: p.pais_origem ? countryFlags[p.pais_origem] : null,
                    paisOrigem: p.pais_origem || null,
                    rating: p.rating || 5.0,
                    volume_ml: p.volume_ml,
                    teor_alcolico: p.teor_alcolico,
                    serve_pessoas: p.serve_pessoas,
                    curtidas: p.curtidas || 0,
                    tipo_vinho: p.tipo_vinho || null,
                    ml_taca: p.ml_taca || 200,
                    disponivel: p.disponivel,
                    visivel_app: p.visivel_app ?? true,
                    ordem: p.ordem || 0,
                    // Dynamic flavor group fields
                    grupo_id_sabor: p.grupo_id_sabor || null,
                    nome_curto_sabor: p.nome_curto_sabor || null,
                    is_master_sabor: p.is_master_sabor || false,
                };
            });

            // Filter out products that are not visible in the app
            const visibleProducts = enrichedProducts.filter(p => p.visivel_app !== false);

            visibleProducts.sort((a, b) => {
                if (a.ordem !== b.ordem) return a.ordem - b.ordem;
                return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
            });

            // Preload only on initial load
            if (isInitial) {
                visibleProducts.slice(0, 3).forEach(p => {
                    if (p.imageUrl) {
                        const img = new Image();
                        img.src = p.imageUrl;
                    }
                });

                // Preload wine glass images to ensure they load fast like everything else
                if (glassMapToPreload) {
                    Object.values(glassMapToPreload).forEach(url => {
                        if (url) {
                            const img = new Image();
                            img.src = url;
                        }
                    });
                }
            }

            // Store all products in ref for reactive filtering
            allProductsRef.current = visibleProducts;
            
            // Wait! fetchMenu has an empty dependency array, so we MUST read from prevFilterRef
            // to avoid React stale closure bugs when resolving async.
            const currentFilters = prevFilterRef.current.filterCategories;
            const currentSubcat = prevFilterRef.current.filterSubcategoria;
            const currentSearch = prevFilterRef.current.searchProductName;
            
            // Apply current filters if they exist (crucial for initial mount via AnimatePresence)
            if (currentFilters && currentFilters.length > 0) {
                const sanitizedFilters = currentFilters.map(f => f.normalize("NFC").toLowerCase().trim());
                let filtered = visibleProducts.filter(p => p.category && sanitizedFilters.includes(p.category.normalize("NFC").toLowerCase().trim()));
                
                if (currentSubcat) {
                    const targetSubs = Array.isArray(currentSubcat)
                        ? currentSubcat.map(s => s.normalize("NFC").toLowerCase().trim())
                        : [currentSubcat.normalize("NFC").toLowerCase().trim()];

                    filtered = filtered.filter(p => 
                        p.subcategoria && targetSubs.includes(p.subcategoria.normalize("NFC").toLowerCase().trim())
                    );
                }
                setProducts(filtered);
            } else if (currentSearch) {
                const term = currentSearch.toLowerCase().trim();
                const termNoSpace = term.replace(/\s+/g, "");

                // Try exact match first to prevent selecting wrong variations like Combos instead of Garrafas
                let matchedProduct = visibleProducts.find(p => p.name?.toLowerCase().trim() === term);

                if (!matchedProduct) {
                    matchedProduct = visibleProducts.find(p => {
                        if (!p.name) return false;
                        const n = p.name.toLowerCase();
                        const nNoSpace = n.replace(/\s+/g, "");
                        return n.includes(term) || nNoSpace.includes(termNoSpace);
                    });
                }

                if (matchedProduct) {
                    const targetCat = matchedProduct.category;
                    const categoryProducts = visibleProducts.filter(p => p.category === targetCat);
                    setProducts(categoryProducts);

                    // Add dynamic selection
                    const targetIdx = categoryProducts.findIndex(p => p.id === matchedProduct.id);
                    setCurrentIndex(targetIdx !== -1 ? targetIdx : 0);
                } else {
                    setProducts(visibleProducts);
                }
            } else {
                setProducts(visibleProducts);
            }
            
            // ── Save full enriched data to cache for instant subsequent navigations ──
            (window as unknown as Record<string, any>).__menuFullCache = {
                enrichedProducts: allProductsRef.current,
                config: configData || null,
                wineGlassImages: glassMapToPreload || null,
                timestamp: Date.now(),
            };

        } catch (error) {
            console.error('Error fetching menu from Supabase:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchMenu(true);
    }, [fetchMenu]);

    // Mark as filtering immediately when props change (prevents old product flash)
    if (
        prevFilterRef.current.filterCategories !== filterCategories ||
        prevFilterRef.current.filterSubcategoria !== filterSubcategoria ||
        prevFilterRef.current.searchProductName !== searchProductName
    ) {
        prevFilterRef.current = { filterCategories, filterSubcategoria, searchProductName };
        if (!isFiltering && allProductsRef.current.length > 0) {
            setIsFiltering(true);
        }
    }

    // Helper functions for pagination and initial product selection
    // DYNAMIC: uses grupo_id_sabor from DB instead of hardcoded slug checks
    const getPrefix = useCallback((prod: Record<string, any>) => {
        if (!prod) return null;
        // If the product has a DB-driven flavor group, use that as the prefix key
        if (prod.grupo_id_sabor) return prod.grupo_id_sabor;
        return null;
    }, []);

    const isValidMaster = useCallback((prod: Record<string, any>) => {
        if (!prod) return false;
        // If DB marks this product as part of a flavor group but NOT the master, hide it from the main listing
        if (prod.grupo_id_sabor && !prod.is_master_sabor) return false;
        return true;
    }, []);

    // Reactively filter products when Home changes the filter/search props
    useEffect(() => {
        const all = allProductsRef.current;
        if (!all || all.length === 0) {
            setIsFiltering(false);
            return;
        }

        if (filterCategories && filterCategories.length > 0) {
            // 1. Filter by category
            const sanitizedFilters = filterCategories.map(f => f.normalize("NFC").toLowerCase().trim());
            let filtered = all.filter(p => p.category && sanitizedFilters.includes(p.category.normalize("NFC").toLowerCase().trim()));

            // 2. Filter by subcategoria
            if (filterSubcategoria) {
                const targetSubs = Array.isArray(filterSubcategoria)
                    ? filterSubcategoria.map(s => s.normalize("NFC").toLowerCase().trim())
                    : [filterSubcategoria.normalize("NFC").toLowerCase().trim()];

                filtered = filtered.filter(p => 
                    p.subcategoria && targetSubs.includes(p.subcategoria.normalize("NFC").toLowerCase().trim())
                );
            }
            setProducts(filtered);
            const firstMasterIdx = filtered.findIndex((p: Record<string, any>) => isValidMaster(p));
            setCurrentIndex(firstMasterIdx !== -1 ? firstMasterIdx : 0);
        } else if (searchProductName) {
            const term = searchProductName.toLowerCase().trim();
            const termNoSpace = term.replace(/\s+/g, "");

            // 1. Find the first direct match in the DB
            const matchedProduct = all.find(p => {
                if (!p.name) return false;
                const n = p.name.toLowerCase();
                const nNoSpace = n.replace(/\s+/g, "");
                return n.includes(term) || nNoSpace.includes(termNoSpace);
            });

            if (matchedProduct) {
                // 2. Identify the category
                const targetCat = matchedProduct.category;

                // 3. Filter products to the entire category so users can swipe left/right to adjoining products
                const categoryProducts = all.filter(p => p.category === targetCat);
                setProducts(categoryProducts);

                // 4. Jump dynamically to the matching product index
                const targetIdx = categoryProducts.findIndex(p => p.id === matchedProduct.id);
                setCurrentIndex(targetIdx !== -1 ? targetIdx : 0);
            } else {
                setProducts(all);
                setCurrentIndex(0);
            }
        } else {
            setProducts(all);
            const firstMasterIdx = all.findIndex((p: Record<string, any>) => isValidMaster(p));
            setCurrentIndex(firstMasterIdx !== -1 ? firstMasterIdx : 0);
        }
        setIsFiltering(false);
    }, [filterCategories, filterSubcategoria, searchProductName]);

    // Realtime subscriptions: auto-refresh on any DB change (debounced to avoid cascading re-fetches)
    useEffect(() => {
        let debounceTimer: NodeJS.Timeout | null = null;
        const debouncedFetch = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => fetchMenu(), 2000);
        };

        const channel = supabase
            .channel('menu-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, debouncedFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'variacoes_produto' }, debouncedFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, debouncedFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tipos_vinho' }, debouncedFetch)
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [fetchMenu]);
    useEffect(() => {
        const checkMode = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            if (isStandalone) {
                document.body.classList.add('is-pwa');
                document.body.classList.remove('is-browser');
            } else {
                document.body.classList.add('is-browser');
                document.body.classList.remove('is-pwa');
            }
        };
        checkMode();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkMode);
    }, []);

    // Apply dark theme to body ONLY when MenuApp is active
    useEffect(() => {
        const themeMetaTag = document.querySelector('meta[name="theme-color"]');
        
        const rootEl = document.getElementById('root');
        
        if (isActive) {
            document.documentElement.classList.add('theme-dark');
            document.body.classList.add('theme-dark');
            if (rootEl) rootEl.classList.add('theme-dark');
            if (themeMetaTag) themeMetaTag.setAttribute('content', '#000000');
        } else {
            document.documentElement.classList.remove('theme-dark');
            document.body.classList.remove('theme-dark');
            if (rootEl) rootEl.classList.remove('theme-dark');
            if (themeMetaTag) themeMetaTag.setAttribute('content', '#e8e8e8');
        }
        
        return () => {
            document.documentElement.classList.remove('theme-dark');
            document.body.classList.remove('theme-dark');
            if (rootEl) rootEl.classList.remove('theme-dark');
            if (themeMetaTag) themeMetaTag.setAttribute('content', '#e8e8e8');
        };
    }, [isActive]);

    // Reset variation when product changes
    useEffect(() => {
        if (currentProduct && currentProduct.variations) {
            setSelectedVariation(Object.keys(currentProduct.variations)[0]);
        }
        setPendingQty(1); // Reset quantity when product changes
    }, [currentIndex, currentProduct?.id]);

    // Smart neighbor preloading: preload prev/next 2 product images
    useEffect(() => {
        if (products.length === 0) return;
        const neighbors = [-2, -1, 1, 2];
        neighbors.forEach(offset => {
            let idx = currentIndex + offset;
            if (idx < 0) idx = products.length + idx;
            if (idx >= products.length) idx = idx - products.length;
            const p = products[idx];
            if (p?.imageUrl) {
                const img = new Image();
                img.src = p.imageUrl;
            }
        });
    }, [currentIndex, products]);

    const paginate = (newDirection) => {
        setDirection(newDirection);
        setIsInternalSpin(false); 

        if (products.length <= 1) return;

        let nextIndex = currentIndex + newDirection;
        const currentProd = products[currentIndex];
        const currentPrefix = getPrefix(currentProd);

        let loopGuard = 0;
        
        while (loopGuard < products.length) {
            loopGuard++;
            if (nextIndex < 0) nextIndex = products.length - 1;
            if (nextIndex >= products.length) nextIndex = 0;

            const nextProd = products[nextIndex];
            
            // 1. Never land on the same product family we are swiping AWAY from (e.g., skip flavors)
            const nextPrefix = getPrefix(nextProd);
            if (currentPrefix && nextPrefix === currentPrefix) {
                nextIndex += newDirection;
                continue;
            }

            // 2. Only land on masters for other families
            if (isValidMaster(nextProd)) {
                break;
            }
            
            nextIndex += newDirection;
        }

        // Fallback if no valid master found of ANOTHER brand
        if (loopGuard >= products.length) {
            nextIndex = currentIndex + newDirection;
            if (nextIndex < 0) nextIndex = products.length - 1;
            if (nextIndex >= products.length) nextIndex = 0;
        }

        setCurrentIndex(nextIndex);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') paginate(1);
            if (e.key === 'ArrowLeft') paginate(-1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const variants = {
        enter: ({ direction, isFood, isInternalSpin }: Record<string, any>) => {
            const isCircular = isFood || isInternalSpin;
            return {
                x: direction > 0 ? (isCircular ? 80 : 30) : (isCircular ? -80 : -30),
                y: isCircular ? 30 : 0,
                rotate: isCircular ? (direction > 0 ? 10 : -10) : 0,
                opacity: 0,
            };
        },
        center: {
            zIndex: 1,
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
        },
        exit: ({ direction, isFood, isInternalSpin }: Record<string, any>) => {
            const isCircular = isFood || isInternalSpin;
            return {
                zIndex: 0,
                x: direction < 0 ? (isCircular ? 80 : 30) : (isCircular ? -80 : -30),
                y: isCircular ? 30 : 0,
                rotate: isCircular ? (direction < 0 ? 10 : -10) : 0,
                opacity: 0,
            };
        },
    };

    if (loading || isFiltering) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.3, delay: 0.3 }} // Delay the loader so it doesn't flash on fast networks
                className="app-container" style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    width: "100vw", height: "100vh",
                    zIndex: 99999, margin: 0, padding: 0, maxWidth: "none",
                    display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000000'
                }}>
                <Loader2 className="animate-spin" style={{ color: '#555' }} size={36} />
            </motion.div>
        );
    }

    if (!currentProduct) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', background: '#000000', color: '#666', width: '100%' }}>
                <p>Nenhum produto encontrado.</p>
                {onBack && (
                    <button 
                        onClick={() => onBack()}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '24px',
                            background: '#D4AF37',
                            color: '#000',
                            fontWeight: '600',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Voltar ao Menu
                    </button>
                )}
            </motion.div>
        );
    }

    // Format current price
    let displayPrice = currentProduct.price;
    let originalDisplayPrice = currentProduct.originalPrice || null;

    if (currentProduct.variations && selectedVariation && currentProduct.variations[selectedVariation]) {
        displayPrice = currentProduct.variations[selectedVariation].price;
        originalDisplayPrice = currentProduct.variations[selectedVariation].originalPrice || null;
    }
    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice);
    const formattedOriginalPrice = originalDisplayPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalDisplayPrice) : null;

    const isTaca = selectedVariation && (selectedVariation.toLowerCase().includes('taça') || selectedVariation.toLowerCase().includes('taca'));
    let displayImage = currentProduct.imageUrl;
    let displayDescription = currentProduct.description;

    // Apply specific logic for Wine glass images
    if (currentProduct.tipo_vinho && isTaca && wineGlassImages[currentProduct.tipo_vinho]) {
        displayImage = wineGlassImages[currentProduct.tipo_vinho];
    }

    // Apply database-driven variation images and descriptions (for combos and new items)
    if (currentProduct.variations && selectedVariation && currentProduct.variations[selectedVariation]) {
        const varData = currentProduct.variations[selectedVariation];
        if (varData.imagem_url && varData.imagem_url.trim() !== '') {
            displayImage = optimizeCloudinaryUrl(varData.imagem_url);
        }
        if (varData.descricao && varData.descricao.trim() !== '') {
            displayDescription = varData.descricao;
        }
    }

    // Swap volume: show ml_taca when Taça is selected, or parse from variation name (e.g. "220ml", "350ml")
    let displayVolume = (currentProduct.tipo_vinho && isTaca) ? currentProduct.ml_taca : currentProduct.volume_ml;
    if (selectedVariation && !isTaca) {
        const mlMatch = selectedVariation.match(/(\d+)\s*ml/i);
        if (mlMatch) {
            displayVolume = parseInt(mlMatch[1]);
        }
    }


    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="app-container" style={{
            backgroundColor: '#000',
            backgroundImage: `url('https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870488/migrated/ozaxg9ubwzpxrlar6wap.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transition: 'background 0.5s ease-in-out'
        }}>
            {/* Background Tint Overlay */}
            <div className="tint-layer" />

            {/* FIXED TOP NAV */}
            <div className="top-nav" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, paddingBottom: 0 }}>
                {/* Nav Icons Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ArrowLeft className="icon" style={{ cursor: onBack ? 'pointer' : 'default' }} onClick={() => onBack && onBack()} />
                    <div className="page-title" style={{ position: 'relative', zIndex: 1 }}>{currentProduct.category}</div>
                    <div ref={cartIconRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={handleOpenCartClick}>
                        <ShoppingBag className="icon" />
                        {totalCartItems > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-8px',
                                background: '#E53935',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: '800',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(229, 57, 53, 0.5)',
                                animation: 'cartBadgePop 0.3s ease'
                            }}>
                                {totalCartItems}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ANIMATED HERO SECTION */}
            <div className="hero">
                <AnimatePresence initial={false} custom={{ direction, isFood: currentProduct?.category === 'Petiscos', isInternalSpin }}>
                    <motion.div
                        key={`${currentProduct.id}-${selectedVariation || ''}`}
                        custom={{ direction, isFood: currentProduct?.category === 'Petiscos', isInternalSpin }}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipeThreshold = 50;
                            const swipeVelocity = 200;
                            const distance = offset.x;
                            const speed = Math.abs(velocity.x);

                            if (distance < -swipeThreshold || (distance < -20 && speed > swipeVelocity)) {
                                paginate(1);
                            } else if (distance > swipeThreshold || (distance > 20 && speed > swipeVelocity)) {
                                paginate(-1);
                            }
                        }}
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.3 }
                        }}
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'absolute',
                            left: 0,
                            right: 0
                        }}
                    >
                        {/* FLAG OVERLAY / PAIS ORIGEM — FIXED HEIGHT TO PREVENT LAYOUT SHIFT */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '2px',
                            marginBottom: '2px',
                            zIndex: 10,
                            height: 'clamp(18px, 4dvh, 30px)',
                            minHeight: 'clamp(18px, 4dvh, 30px)'
                        }}>
                            {currentProduct.flagUrl && (
                                <img
                                    src={currentProduct.flagUrl}
                                    alt="Origin Flag"
                                    loading="eager"
                                    decoding="async"
                                    fetchPriority="high"
                                    style={{
                                        width: '24px',
                                        height: 'auto',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                    }}
                                />
                            )}
                            {currentProduct.paisOrigem && (
                                <span style={{
                                    color: '#555555',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase'
                                }}>
                                    {currentProduct.paisOrigem}
                                </span>
                            )}
                        </div>

                        {/* TITLE CONTAINER - FIXED HEIGHT TO PREVENT LAYOUT SHIFT */}
                        <div style={{
                            padding: '0 20px',
                            textAlign: 'center',
                            width: '90%',
                            marginBottom: 'clamp(4px, 1.2dvh, 10px)',
                            zIndex: 5,
                            height: 'clamp(22px, 4.5dvh, 34px)',
                            minHeight: 'clamp(22px, 4.5dvh, 34px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            <h1
                                ref={heroTitleRef}
                                style={{
                                    fontFamily: 'Playfair Display, serif',
                                    fontSize: 'clamp(16px, 3.2dvh, 24px)',
                                    fontWeight: 900,
                                    color: '#222',
                                    textAlign: 'center',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%'
                                }}
                            >
                                {currentProduct.name}
                            </h1>
                        </div>

                        <div style={{ position: 'relative', width: '100%', height: 'clamp(110px, 33dvh, 280px)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'clamp(0px, 0.5dvh, 5px)' }}>
                            {/* Back Glow */}
                            <div style={{
                                position: 'absolute', width: '200px', height: '200px',
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                                borderRadius: '50%', zIndex: 0
                            }} />

                            <OptimizedImage
                                src={displayImage}
                                alt={currentProduct.name}
                                isUnavailable={!currentProduct.disponivel}
                            />

                            {!currentProduct.disponivel && (
                                <div style={{
                                    position: 'absolute',
                                    zIndex: 3,
                                    padding: '6px 14px',
                                    border: '4px solid #ef4444',
                                    borderRadius: '6px',
                                    transform: 'rotate(-10deg)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    background: 'rgba(0,0,0,0.15)',
                                    backdropFilter: 'blur(2px)'
                                }}>
                                    <span style={{ 
                                        color: '#ef4444', 
                                        fontWeight: '900', 
                                        letterSpacing: '3px', 
                                        fontSize: '24px',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                                    }}>ESGOTADO</span>
                                </div>
                            )}

                            {/* Real ground shadow */}
                            <div style={{
                                position: 'absolute', bottom: '15px', width: '150px', height: '20px',
                                background: 'rgba(0,0,0,0.6)', borderRadius: '50%', filter: 'blur(15px)', zIndex: 1
                            }} />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* NAVIGATION ARROWS */}
                <div style={{ position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)', zIndex: 20, cursor: 'pointer' }} onClick={() => paginate(-1)}>
                    <ChevronLeft size={36} color="#333" style={{ transform: currentProduct.category === 'Petiscos' ? 'rotate(-30deg)' : 'none' }} />
                </div>
                <div style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', zIndex: 20, cursor: 'pointer' }} onClick={() => paginate(1)}>
                    <ChevronRight size={36} color="#333" style={{ transform: currentProduct.category === 'Petiscos' ? 'rotate(30deg)' : 'none' }} />
                </div>
            </div>

            {/* BOTTOM SHEET */}
            <div className="bottom-sheet" style={{ position: 'relative' }}>
                <div className="drag-handle" />

                {/* FIXED HEART ON THE SIDE */}
                <div style={{ position: 'absolute', top: 'clamp(45px, 8dvh, 65px)', right: '15px', zIndex: 100 }}>
                    <button
                        onClick={async (e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;

                            // Create 6-8 particles
                            const newParticles = Array.from({ length: 8 }).map(() => ({
                                id: Math.random(),
                                x: centerX,
                                y: centerY
                            }));

                            setHeartParticles(prev => [...prev, ...newParticles]);

                            // Calculate session-based local liked state with daily expiration for PWAs
                            const sessionLikedKey = '@Menu-Session-Liked';
                            const todayStr = new Date().toLocaleDateString('pt-BR');
                            
                            let likedData = { date: todayStr, items: [] };
                            try {
                                const stored = JSON.parse(sessionStorage.getItem(sessionLikedKey));
                                if (stored && stored.date === todayStr && Array.isArray(stored.items)) {
                                    likedData = stored;
                                }
                            } catch (e) {
                                // Ignore parsing errors, reset
                            }

                            const isAlreadyLikedInSession = likedData.items.includes(currentProduct.id);

                            if (!isAlreadyLikedInSession) {
                                // Add to session storage so it stays red only for today
                                likedData.items.push(currentProduct.id);
                                sessionStorage.setItem(sessionLikedKey, JSON.stringify(likedData));

                                // Optmistic UI Update: Fill the heart immediately while DB processes
                                setProducts(prevProducts => prevProducts.map(p =>
                                    p.id === currentProduct.id
                                        ? { ...p, curtidas: (p.curtidas || 0) + 1 }
                                        : p
                                ));

                                try {
                                    await supabase.rpc('increment_likes', { product_id: currentProduct.id });
                                    // Keep fetchMenu running in background to sync true state invisibly
                                    fetchMenu();
                                } catch (err) {
                                    console.error("Error liking product:", err);
                                    // Revert optimistic update on failure
                                    setProducts(prevProducts => prevProducts.map(p =>
                                        p.id === currentProduct.id
                                            ? { ...p, curtidas: Math.max(0, (p.curtidas || 1) - 1) }
                                            : p
                                    ));
                                    
                                    // Remove from session local storage on fail
                                    likedData.items = likedData.items.filter(id => id !== currentProduct.id);
                                    sessionStorage.setItem(sessionLikedKey, JSON.stringify(likedData));
                                }
                            }
                        }}
                        style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        {(() => {
                            let isLikedToday = false;
                            if (typeof window !== 'undefined') {
                                try {
                                    const todayStr = new Date().toLocaleDateString('pt-BR');
                                    const stored = JSON.parse(sessionStorage.getItem('@Menu-Session-Liked'));
                                    if (stored && stored.date === todayStr && Array.isArray(stored.items)) {
                                        isLikedToday = stored.items.includes(currentProduct.id);
                                    }
                                } catch (e) {}
                            }
                            return (
                                <Heart
                                    size={22}
                                    color="#444"
                                    fill={isLikedToday ? "#444" : "transparent"}
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                                />
                            );
                        })()}
                    </button>
                </div>

                <div className="sheet-content">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentProduct.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(4px, 1.5vw, 8px)', width: '100%', marginTop: '4px', position: 'relative' }}>
                                {/* Left Container: Rating & Category */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                                    <div className="rating" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const effectiveRating = currentProduct.rating || 5;
                                            const isFull = star <= Math.floor(effectiveRating);
                                            const isEmpty = star > Math.ceil(effectiveRating);
                                            const isPartial = !isFull && !isEmpty;
                                            const fillPercentage = isPartial ? (effectiveRating % 1) * 100 : 0;

                                            return (
                                                <span
                                                    key={star}
                                                    className={`star ${isEmpty ? 'inactive' : ''}`}
                                                    style={{
                                                        fontSize: '11px',
                                                        position: 'relative',
                                                        display: 'inline-block',
                                                        color: isFull ? 'var(--star-color)' : (isPartial ? 'transparent' : '#333'),
                                                        backgroundImage: isPartial ? `linear-gradient(90deg, var(--star-color) ${fillPercentage}%, #333 ${fillPercentage}%)` : 'none',
                                                        WebkitBackgroundClip: isPartial ? 'text' : 'none',
                                                        MozBackgroundClip: isPartial ? 'text' : 'none',
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            );
                                        })}
                                        <div className="category-label" style={{ marginBottom: 0, marginLeft: '6px', fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {currentProduct.category}
                                        </div>
                                    </div>
                                </div>

                                {/* LOGO OCULTA MOMENTANEAMENTE - PARA REATIVAR, DESCOMENTE O BLOCO ABAIXO */}
                                {/* 
                                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 0 }}>
                                    <img
                                        src="https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870490/migrated/csxl9gvgqpm5vqj8ww5w.png"
                                        alt="Logo Restaurante"
                                        fetchPriority="high"
                                        loading="eager"
                                        decoding="sync"
                                        style={{ width: '30px', height: 'auto', opacity: 0.85 }}
                                    />
                                </div>
                                */}

                                {/* Right Container: Price */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', zIndex: 1 }}>
                                    <div className="price-tag flex items-center gap-2" style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', fontSize: '14px', fontWeight: '800' }}>
                                        {formattedOriginalPrice && (
                                            <span style={{ textDecoration: 'line-through', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}>
                                                {formattedOriginalPrice}
                                            </span>
                                        )}
                                        {formattedPrice}
                                    </div>
                                </div>
                            </div>

                            <div className="info-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                <div className="product-name" style={{ fontSize: 'clamp(14px, 4.5vw, 20px)', textAlign: 'center' }}>
                                    {currentProduct.name}
                                </div>
                            </div>

                            {/* ELITE METADATA LINE */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(3px, 1.2vw, 8px)', marginBottom: 'clamp(2px, 1dvh, 10px)', opacity: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
                                {currentProduct.tipo_vinho && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#A0A0A0' }}>
                                        <Droplet size={10} fill={currentProduct.tipo_vinho === 'tinto' ? '#722F37' : currentProduct.tipo_vinho === 'rose' ? '#DB7093' : '#F5F5F5'} color={currentProduct.tipo_vinho === 'tinto' ? '#722F37' : currentProduct.tipo_vinho === 'rose' ? '#DB7093' : '#F5F5F5'} /> {currentProduct.tipo_vinho === 'rose' ? 'Rosé' : currentProduct.tipo_vinho === 'tinto' ? 'Tinto' : 'Branco'}
                                    </div>
                                )}
                                {currentProduct.tipo_vinho && (displayVolume || currentProduct.teor_alcolico > 0) && <span style={{ color: '#A0A0A0', fontSize: '10px' }}>•</span>}
                                {displayVolume && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#A0A0A0' }}>
                                        <Droplet size={10} /> {displayVolume >= 1000 ? `${displayVolume / 1000}L` : `${displayVolume}ml`}
                                    </div>
                                )}
                                {displayVolume && currentProduct.teor_alcolico > 0 && <span style={{ color: '#A0A0A0', fontSize: '10px' }}>•</span>}
                                {currentProduct.teor_alcolico > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#A0A0A0' }}>
                                        Teor Alcoólico: {currentProduct.teor_alcolico}% vol
                                    </div>
                                )}
                                {((displayVolume || currentProduct.teor_alcolico > 0) && currentProduct.serve_pessoas) && <span style={{ color: '#A0A0A0', fontSize: '10px' }}>•</span>}
                                {currentProduct.serve_pessoas && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#A0A0A0' }}>
                                        <Users size={10} /> Serve {currentProduct.serve_pessoas} {currentProduct.serve_pessoas > 1 ? 'pes.' : 'pes.'}
                                    </div>
                                )}
                            </div>

                            <p className="description" style={{
                                marginBottom: 'clamp(4px, 2vw, 10px)',
                                fontSize: 'clamp(10px, 2.8vw, 12px)',
                                color: '#ccc',
                                textAlign: 'center',
                                lineHeight: '1.4'
                            }}>
                                {displayDescription}
                            </p>

                            {/* MULTI-FLAVOR / VARIATION SELECTION — DYNAMIC (reads DB) */}
                            {((currentProduct.variations && Object.keys(currentProduct.variations).length > 1) ||
                                currentProduct.grupo_id_sabor) && (
                                    <div style={{ marginTop: '0px', marginBottom: 'clamp(4px, 1.5dvh, 20px)', width: '100%' }}>
                                        <div style={{
                                            textAlign: 'center',
                                            fontSize: 'clamp(7px, 2vw, 9px)',
                                            fontWeight: '800',
                                            color: 'var(--accent-gold)',
                                            letterSpacing: '1.2px',
                                            textTransform: 'uppercase',
                                            marginBottom: 'clamp(4px, 2vw, 10px)'
                                        }}>
                                            Escolha sua Opção
                                        </div>
                                        <div
                                            className="flavors-grid"
                                            onPointerDownCapture={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                justifyContent: 'center',
                                                gap: 'clamp(4px, 1.5vw, 8px)',
                                                padding: '0 5px'
                                            }}
                                        >
                                            {/* OPTION 1: DB-DRIVEN FLAVOR GROUP (grupo_id_sabor) */}
                                            {currentProduct.grupo_id_sabor ? (
                                                // Get all sibling products that share the same grupo_id_sabor, ordered by ordem
                                                (() => {
                                                    const siblings = products
                                                        .filter(p => p.grupo_id_sabor === currentProduct.grupo_id_sabor)
                                                        .sort((a, b) => {
                                                            if (a.is_master_sabor && !b.is_master_sabor) return -1;
                                                            if (!a.is_master_sabor && b.is_master_sabor) return 1;
                                                            return (a.ordem || 0) - (b.ordem || 0);
                                                        });
                                                    return siblings.map((sibling, siblingIdx) => {
                                                        const isSelected = sibling.id === currentProduct.id;
                                                        const currentSiblingIdx = siblings.findIndex(s => s.id === currentProduct.id);
                                                        return (
                                                            <button
                                                                key={sibling.id}
                                                                onClick={() => {
                                                                    const targetIndex = products.findIndex(p => p.id === sibling.id);
                                                                    if (targetIndex !== -1 && targetIndex !== currentIndex) {
                                                                        const spinDirection = siblingIdx > currentSiblingIdx ? 1 : -1;
                                                                        setDirection(spinDirection);
                                                                        setIsInternalSpin(true);
                                                                        setTimeout(() => setCurrentIndex(targetIndex), 0);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: 'clamp(4px, 1vw, 6px) clamp(5px, 1.5vw, 10px)',
                                                                    borderRadius: '18px',
                                                                    border: `1.1px solid ${isSelected ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                                                                    background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                    color: isSelected ? '#D4AF37' : '#999',
                                                                    fontSize: 'clamp(8.5px, 2.2vw, 10px)',
                                                                    fontWeight: '700',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px',
                                                                    transition: 'all 0.2s ease',
                                                                    cursor: 'pointer',
                                                                    boxShadow: isSelected ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none'
                                                                }}
                                                            >
                                                                {sibling.nome_curto_sabor || sibling.name}
                                                            </button>
                                                        );
                                                    });
                                                })()
                                            ) : (
                                                /* OPTION 2: VARIATIONS (OTHER PRODUCTS) */
                                                Object.keys(currentProduct.variations).map((variant, variantIdx) => {
                                                    const isSelected = selectedVariation === variant;
                                                    return (
                                                        <button
                                                            key={variant}
                                                            onClick={() => {
                                                                const isWineOrCombo = currentProduct.category && /vinho|combo/.test(currentProduct.category.toLowerCase());
                                                                if (isWineOrCombo && selectedVariation !== variant) {
                                                                    const currentVariantIdx = Object.keys(currentProduct.variations).indexOf(selectedVariation);
                                                                    setDirection(variantIdx > currentVariantIdx ? 1 : -1);
                                                                    setIsInternalSpin(true);
                                                                }
                                                                setSelectedVariation(variant);
                                                            }}
                                                            style={{
                                                                padding: 'clamp(5px, 1.5vw, 8px) clamp(8px, 3vw, 14px)',
                                                                borderRadius: '18px',
                                                                border: `1.1px solid ${isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}`,
                                                                background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                color: isSelected ? 'var(--accent-gold)' : '#999',
                                                                fontSize: 'clamp(9px, 2.5vw, 11px)',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap',
                                                                boxShadow: isSelected ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none'
                                                            }}
                                                        >
                                                            {variant}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* QUANTITY + ADD TO CART - PINNED TO BOTTOM */}
                {(() => {
                    const itemTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice * pendingQty);

                    let currentStock = -1; // Default -1 means unlimited
                    if (currentProduct.variations && selectedVariation && currentProduct.variations[selectedVariation]) {
                        currentStock = currentProduct.variations[selectedVariation].stock;
                    }

                    const isOutOfStock = currentStock === 0 || !currentProduct.disponivel;

                    return (
                        <div className="sheet-footer">
                            <div className="super-pill">
                                <div className="qty-controls-integrated" style={{ opacity: isOutOfStock ? 0.5 : 1 }}>
                                    <button
                                        className={`qty-ball ${pendingQty <= 1 || isOutOfStock ? 'disabled' : ''}`}
                                        onClick={() => setPendingQty(q => Math.max(1, q - 1))}
                                        disabled={pendingQty <= 1 || isOutOfStock}
                                    >
                                        −
                                    </button>
                                    <span className="qty-number">{pendingQty}</span>
                                    <button
                                        className={`qty-ball ${(currentStock !== -1 && pendingQty >= currentStock) || isOutOfStock ? 'disabled' : ''}`}
                                        onClick={() => setPendingQty(q => q + 1)}
                                        disabled={(currentStock !== -1 && pendingQty >= currentStock) || isOutOfStock}
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    className="add-btn"
                                    onClick={(e) => {
                                        if (isOutOfStock) return;
                                        const addQty = pendingQty;
                                        const btnRect = e.currentTarget.getBoundingClientRect();
                                        const cartEl = cartIconRef.current;
                                        if (cartEl) {
                                            const cartRect = cartEl.getBoundingClientRect();
                                            const id = Date.now();
                                            setFlyingItems(prev => [...prev, {
                                                id,
                                                startX: btnRect.left + btnRect.width / 2,
                                                startY: btnRect.top,
                                                endX: cartRect.left + cartRect.width / 2,
                                                endY: cartRect.top + cartRect.height / 2
                                            }]);
                                            setCart(prev => ({
                                                ...prev,
                                                [selectedVariation ? `${currentProduct.id}-${selectedVariation}` : currentProduct.id]: (prev[selectedVariation ? `${currentProduct.id}-${selectedVariation}` : currentProduct.id] || 0) + addQty
                                            }));
                                            setTimeout(() => {
                                                setFlyingItems(prev => prev.filter(f => f.id !== id));
                                            }, 600);
                                        } else {
                                            setCart(prev => ({
                                                ...prev,
                                                [selectedVariation ? `${currentProduct.id}-${selectedVariation}` : currentProduct.id]: (prev[selectedVariation ? `${currentProduct.id}-${selectedVariation}` : currentProduct.id] || 0) + addQty
                                            }));
                                        }
                                        setPendingQty(1);
                                    }}
                                    disabled={isOutOfStock}
                                    style={{
                                        background: isOutOfStock ? '#333' : undefined,
                                        color: isOutOfStock ? '#888' : undefined,
                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                        {isOutOfStock ? 'ESGOTADO' : 'ADICIONAR'}
                                    </span>
                                    {!isOutOfStock && (
                                        <span style={{ fontWeight: '900', fontSize: '14px', marginLeft: '8px', whiteSpace: 'nowrap' }}>{itemTotal}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* FLYING ITEMS ANIMATION */}
            {flyingItems.map(item => (
                <div
                    key={item.id}
                    style={{
                        position: 'fixed',
                        left: item.startX - 10,
                        top: item.startY - 10,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--cart-animation-start), var(--cart-animation-end))',
                        boxShadow: '0 0 12px rgba(212, 175, 55, 0.6)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        animation: 'flyToCart 0.6s ease-in forwards',
                        '--end-x': `${item.endX - item.startX}px`,
                        '--end-y': `${item.endY - item.startY}px`
                    }}
                />
            ))}

            {/* HEART BURST PARTICLES */}
            {heartParticles.map(particle => (
                <HeartParticle
                    key={particle.id}
                    x={particle.x}
                    y={particle.y}
                    onComplete={() => setHeartParticles(prev => prev.filter(p => p.id !== particle.id))}
                />
            ))}

            {/* CART OVERLAY / MODAL */}
            <AnimatePresence>
                {isCartOpen && (
                    <motion.div
                        className="cart-overlay"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <div className="cart-header" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
                            <ArrowLeft 
                                size={22} 
                                color="#FFFFFF" 
                                style={{ cursor: 'pointer', marginRight: '16px' }} 
                                onClick={() => {
                                    setIsCartOpen(false);
                                    if (onTabChange) onTabChange('menu');
                                }} 
                            />
                            <span className="cart-title">Comanda</span>
                        </div>
                        
                        {/* TABS */}
                        <div className="cart-tabs">
                            <button 
                                className={`cart-tab ${cartTab === 'carrinho' ? 'active' : ''}`}
                                onClick={() => setCartTab('carrinho')}
                            >
                                Sacola
                            </button>
                            <button 
                                className={`cart-tab ${cartTab === 'pedidos' ? 'active' : ''}`}
                                onClick={() => setCartTab('pedidos')}
                            >
                                Meus Pedidos
                            </button>
                        </div>

                        <div className="cart-items-container">
                            {/* PEOPLE GROUPING IDENTIFIER */}
                            {pessoaAtiva && (
                                <div className="cart-person-section" style={{marginBottom: '10px'}}>
                                    <h5 style={{fontSize: '11px', color: '#666', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Comanda Identificada</h5>
                                    <div className="cart-person-active" style={{marginTop: '0px', padding: '6px 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px'}}>
                                        <span className="cart-person-active-name" style={{color: '#111827', fontWeight: 600, fontSize: '13px'}}>
                                            <div style={{width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900}}>
                                                {pessoaAtiva.charAt(0).toUpperCase()}
                                            </div>
                                            {pessoaAtiva}
                                        </span>
                                        <button className="cart-person-change-btn" onClick={() => setIsPeopleDrawerOpen(true)}>
                                            Trocar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: CARRINHO */}
                            {cartTab === 'carrinho' && (
                                <>
                                    {/* UPSELL SECTION */}
                                    {Object.keys(cart).length > 0 && products.length > 0 && (
                                        <div className="cart-upsell-container">
                                            <h4 className="upsell-title">Que tal adicionar?</h4>
                                            <div className="upsell-scroll">
                                                <div className="upsell-marquee">
                                                    {(() => {
                                                        const availableForUpsell = allProductsRef.current.filter(p => !cart[p.id] && !Object.keys(cart).some(k => k.startsWith(p.id)) && p.id !== currentProduct?.id);
                                                        
                                                        // Sort raw list mostly by likes, but not completely to allow interleaving
                                                        const sortedByLikes = [...availableForUpsell].sort((a, b) => (b.curtidas || 0) - (a.curtidas || 0));
                                                        
                                                        // Interleaving approach: we want an alternating pattern of categories
                                                        // like: Petisco -> Drink -> Cerveja/Combo -> Pastel -> repeat
                                                        
                                                        const interleaved = [];
                                                        const grouped = {
                                                            petiscos: sortedByLikes.filter(p => p.category === 'Petiscos'),
                                                            drinks: sortedByLikes.filter(p => p.category === 'Drinks' || p.category === 'Gins'),
                                                            cervejas: sortedByLikes.filter(p => p.category === 'Cervejas' || p.category === 'Destilados' || p.category === 'Combos'),
                                                            pasteis: sortedByLikes.filter(p => p.category === 'Pastéis' || p.category === 'Sobremesas'),
                                                            outros: sortedByLikes.filter(p => !['Petiscos', 'Drinks', 'Gins', 'Cervejas', 'Destilados', 'Combos', 'Pastéis', 'Sobremesas'].includes(p.category))
                                                        };
                                                        
                                                        const maxLoops = Math.max(grouped.petiscos.length, grouped.drinks.length, grouped.cervejas.length, grouped.pasteis.length, grouped.outros.length);
                                                        
                                                        for (let i = 0; i < maxLoops; i++) {
                                                            if (grouped.petiscos[i]) interleaved.push(grouped.petiscos[i]);
                                                            if (grouped.drinks[i]) interleaved.push(grouped.drinks[i]);
                                                            if (grouped.pasteis[i]) interleaved.push(grouped.pasteis[i]);
                                                            if (grouped.cervejas[i]) interleaved.push(grouped.cervejas[i]);
                                                            if (grouped.outros[i]) interleaved.push(grouped.outros[i]);
                                                            
                                                            // We just need around 10-12 items max to keep UI smooth and performant
                                                            if (interleaved.length >= 10) break;
                                                        }

                                                        // Fallback just in case everything was empty (edge case)
                                                        if (interleaved.length === 0) {
                                                            return sortedByLikes.slice(0, 8);
                                                        }
                                                        
                                                        return interleaved;
                                                    })().map(p => (
                                                            <div key={p.id} className="upsell-item" onClick={() => {
                                                                setCart(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
                                                            }}>
                                                                <div className="upsell-img-box">
                                                                    <img src={p.imageUrl} alt={p.name} />
                                                                </div>
                                                                <div className="upsell-info">
                                                                    <span className="upsell-name">{p.name}</span>
                                                                    <span className="upsell-price">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                                                                    </span>
                                                                </div>
                                                                <div className="upsell-add-icon">+</div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {Object.keys(cart).length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.8, marginTop: '40px' }}>
                                            <ShoppingCart size={48} color="#FFFFFF" style={{ marginBottom: '16px' }} />
                                            <p style={{ color: '#999999', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>Sua sacola está vazia.</p>
                                            <button 
                                                onClick={() => {
                                                    setIsCartOpen(false);
                                                    if (onTabChange) onTabChange('menu');
                                                }}
                                                style={{ background: '#FFFFFF', color: '#000000', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, fontSize: '12px', border: 'none' }}
                                            >
                                                FAZER PEDIDO
                                            </button>
                                        </div>
                                    ) : (
                                        Object.entries(cart).map(([key, qty]) => {
                                            const hasVariation = key.includes('-');
                                            let pid = key;
                                            let varName = null;
                                            if (hasVariation) {
                                                const parts = key.split('-');
                                                pid = parts[0];
                                                varName = parts.slice(1).join('-');
                                            }
                                            const pModel = allProductsRef.current.find(p => p.id === pid);
                                            if (!pModel) return null;

                                            let itemPrice = pModel.price;
                                            let itemImage = pModel.imageUrl;
                                            let displayVarName = null;

                                            if (hasVariation && pModel.variations && pModel.variations[varName]) {
                                                itemPrice = pModel.variations[varName].price;
                                                displayVarName = varName;
                                                const isTaca = varName.toLowerCase().includes('taça') || varName.toLowerCase().includes('taca');
                                                if (pModel.tipo_vinho && isTaca && wineGlassImages[pModel.tipo_vinho]) {
                                                    itemImage = wineGlassImages[pModel.tipo_vinho];
                                                }
                                            }

                                            const hasObs = !!itemObservations[key];
                                            const isObsOpen = obsOpenFor === key;

                                            return (
                                                <div key={key} className="cart-item" style={{flexDirection: 'column', alignItems: 'stretch', gap: 0}}>
                                                    <div style={{display: 'flex', gap: '12px', alignItems: 'center', width: '100%'}}>
                                                        <div className="cart-item-image">
                                                            <img src={itemImage} alt={pModel.name} />
                                                        </div>
                                                        <div className="cart-item-info">
                                                            <div className="cart-item-title">{pModel.name}</div>
                                                            {displayVarName && <div className="cart-item-meta">{displayVarName}</div>}
                                                            <div className="cart-item-price">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemPrice)}
                                                            </div>
                                                        </div>
                                                        <div className="cart-item-actions">
                                                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                                <button 
                                                                    className={`cart-item-obs-toggle ${hasObs ? 'has-obs' : ''}`}
                                                                    onClick={() => setObsOpenFor(isObsOpen ? null : key)}
                                                                >
                                                                    <MessageSquare size={16} fill={hasObs ? "var(--accent-gold)" : "none"} />
                                                                </button>
                                                                <button className="cart-trash-btn" onClick={() => {
                                                                    setCart(prev => {
                                                                        const newC = { ...prev };
                                                                        delete newC[key];
                                                                        return newC;
                                                                    });
                                                                }}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="cart-qty-controls">
                                                                <button className="cart-qty-btn" onClick={() => {
                                                                    setCart(prev => ({ ...prev, [key]: Math.max(1, prev[key] - 1) }));
                                                                }}>
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="cart-qty-val">{qty}</span>
                                                                <button className="cart-qty-btn" onClick={() => {
                                                                    setCart(prev => ({ ...prev, [key]: prev[key] + 1 }));
                                                                }}>
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {isObsOpen && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                                            <input 
                                                                type="text" 
                                                                className="cart-item-obs-input" 
                                                                placeholder="Ex: Sem cebola, bem passado..."
                                                                value={itemObservations[key] || ''}
                                                                onChange={(e) => setItemObservations(prev => ({...prev, [key]: e.target.value}))}
                                                                autoFocus
                                                            />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}


                                </>
                            )}

                            {/* TAB: MEUS PEDIDOS */}
                            {cartTab === 'pedidos' && (
                                <div className="order-history-container">
                                    {isFetchingHistory && orderHistory.length === 0 ? (
                                        <div className="order-history-empty">
                                            <Loader2 size={32} color="var(--accent-gold)" className="animate-spin" />
                                            <p>Carregando histórico...</p>
                                        </div>
                                    ) : orderHistory.length === 0 ? (
                                        <div className="order-history-empty">
                                            <Receipt size={48} color="#444" />
                                            <p>Nenhum pedido confirmado ainda.</p>
                                        </div>
                                    ) : (
                                        orderHistory.map(pedido => {
                                            const items = pedido.itens_pedido || [];
                                            // Timeline status mapping (1=recebido, 2=preparando, 3=pronto, 4=servido)
                                            let currentStep = 1;
                                            if (pedido.status === 'preparando') currentStep = 2;
                                            if (pedido.status === 'pronto') currentStep = 3;
                                            if (pedido.status === 'servido') currentStep = 4;

                                            return (
                                                <div key={pedido.id} className="order-card">
                                                    <div className="order-card-header">
                                                        <span className="order-card-id">Pedido #{pedido.id.toString().substring(0, 5)}</span>
                                                        <span className="order-card-time">
                                                            <Clock size={12} style={{display:'inline', marginRight:'4px'}}/>
                                                            {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>

                                                    <div className="order-timeline">
                                                        {['Recebido', 'Preparando', 'Servido', 'Concluído'].map((label, idx) => {
                                                            const stepNum = idx + 1;
                                                            const isDone = stepNum < currentStep;
                                                            const isCurrent = stepNum === currentStep;
                                                            return (
                                                                <div key={label} className={`timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                                                    <div className="timeline-line" />
                                                                    <div className="timeline-dot" />
                                                                    <span className="timeline-label">{label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="order-card-items">
                                                        {items.map(it => (
                                                            <div key={it.id} style={{display:'flex', flexDirection:'column', gap: '2px'}}>
                                                                <div className="order-card-item-row">
                                                                    <span className="order-card-item-name">
                                                                        <span className="order-card-item-qty">{it.quantidade}x</span>
                                                                        {it.nome_produto} {it.nome_variacao ? `(${it.nome_variacao})` : ''}
                                                                    </span>
                                                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.preco_total)}</span>
                                                                </div>
                                                                {it.observacao && (
                                                                    <span className="order-card-item-obs">"{it.observacao}"</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="order-card-total">
                                                        <span>Total do Pedido</span>
                                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                        </div>

                        {/* FOOTER SECTION (Service Buttons + Subtotal + Checkout) */}
                        <div style={{ background: '#000000', borderTop: 'none', position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: '12px', zIndex: 100 }}>
                            <div className="cart-service-buttons">
                                <button 
                                    className={`service-btn ${(garcomCalled || garcomCooldown) ? 'active' : ''}`}
                                    onClick={() => handleCallService('garcom')}
                                    disabled={garcomCooldown || garcomCalled}
                                >
                                    <Bell size={16} /> 
                                    {garcomCalled ? "Garçom Chamado" : "Chamar Garçom"}
                                </button>
                                <button 
                                    className={`service-btn ${(contaCalled || contaCooldown) ? 'active' : ''}`}
                                    onClick={() => handleCallService('conta')}
                                    disabled={contaCooldown || contaCalled}
                                >
                                    <Receipt size={16} /> 
                                    {contaCalled ? "Conta Solicitada" : "Fechar Conta"}
                                </button>
                            </div>

                            {cartTab === 'carrinho' && (
                                <div className="cart-footer" style={{position: 'relative', bottom: 'auto', borderTop: 'none'}}>
                                    <div className="cart-subtotal-row" style={{marginBottom: '10px'}}>
                                        <span className="cart-subtotal-label">Total do Pedido</span>
                                        <span className="cart-subtotal-value">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                Object.entries(cart).reduce((sum, [key, qty]) => {
                                                    const hasVariation = key.includes('-');
                                                    const pid = hasVariation ? key.split('-')[0] : key;
                                                    const varName = hasVariation ? key.split('-').slice(1).join('-') : null;
                                                    const pModel = allProductsRef.current.find(p => p.id === pid);
                                                    if (!pModel) return sum;
                                                    let currentPrice = pModel.price;
                                                    if (hasVariation && pModel.variations && pModel.variations[varName]) {
                                                        currentPrice = pModel.variations[varName].price;
                                                    }
                                                    return sum + (currentPrice * qty);
                                                }, 0)
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        className="checkout-btn"
                                        onClick={() => {
                                        if (!pessoaAtiva) {
                                            setIsPeopleDrawerOpen(true);
                                            return;
                                        }
                                        handleCheckout();
                                        }}
                                        disabled={Object.keys(cart).length === 0 || isCheckingOut}
                                        style={{ 
                                            opacity: (Object.keys(cart).length === 0 || isCheckingOut) ? 0.5 : 1,
                                            animation: (Object.keys(cart).length > 0 && !isCheckingOut) ? 'pulse-gold-border 2s infinite' : 'none'
                                        }}
                                    >
                                        {isCheckingOut ? (
                                            <><Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> ENVIANDO...</>
                                        ) : (
                                            <>FINALIZAR PEDIDO</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {cartTab === 'pedidos' && (
                                <div className="cart-footer" style={{position: 'relative', bottom: 'auto', borderTop: 'none', padding: '0 20px 24px'}}>
                                    <div className="cart-subtotal-row" style={{marginBottom: 0}}>
                                        <span className="cart-subtotal-label">Total da sua comanda</span>
                                        <span className="cart-subtotal-value">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                orderHistory.reduce((sum, ped) => sum + ped.total, 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLYING ITEMS ANIMATION */}
            {flyingItems.map(item => (
                <div
                    key={item.id}
                    style={{
                        position: 'fixed',
                        left: item.startX - 10,
                        top: item.startY - 10,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--cart-animation-start), var(--cart-animation-end))',
                        boxShadow: '0 0 12px rgba(212, 175, 55, 0.6)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        animation: 'flyToCart 0.6s ease-in forwards',
                        '--end-x': `${item.endX - item.startX}px`,
                        '--end-y': `${item.endY - item.startY}px`
                    }}
                />
            ))}

            {/* HEART BURST PARTICLES */}
            {heartParticles.map(particle => (
                <HeartParticle
                    key={particle.id}
                    x={particle.x}
                    y={particle.y}
                    onComplete={() => setHeartParticles(prev => prev.filter(p => p.id !== particle.id))}
                />
            ))}

            {/* CART OVERLAY / MODAL */}
            <AnimatePresence>
                {isCartOpen && (
                    <motion.div
                        className="cart-overlay"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <div className="cart-header" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
                            <ArrowLeft 
                                size={22} 
                                color="#FFFFFF" 
                                style={{ cursor: 'pointer', marginRight: '16px' }} 
                                onClick={() => {
                                    setIsCartOpen(false);
                                    if (onTabChange) onTabChange('menu');
                                }} 
                            />
                            <span className="cart-title">Comanda</span>
                        </div>
                        
                        {/* TABS */}
                        <div className="cart-tabs">
                            <button 
                                className={`cart-tab ${cartTab === 'carrinho' ? 'active' : ''}`}
                                onClick={() => setCartTab('carrinho')}
                            >
                                Sacola
                            </button>
                            <button 
                                className={`cart-tab ${cartTab === 'pedidos' ? 'active' : ''}`}
                                onClick={() => setCartTab('pedidos')}
                            >
                                Meus Pedidos
                            </button>
                        </div>

                        <div className="cart-items-container">
                            {/* PEOPLE GROUPING IDENTIFIER */}
                            {pessoaAtiva && (
                                <div className="cart-person-section" style={{marginBottom: '10px'}}>
                                    <h5 style={{fontSize: '11px', color: '#666', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Comanda Identificada</h5>
                                    <div className="cart-person-active" style={{marginTop: '0px', padding: '6px 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px'}}>
                                        <span className="cart-person-active-name" style={{color: '#111827', fontWeight: 600, fontSize: '13px'}}>
                                            <div style={{width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900}}>
                                                {pessoaAtiva.charAt(0).toUpperCase()}
                                            </div>
                                            {pessoaAtiva}
                                        </span>
                                        <button className="cart-person-change-btn" onClick={() => setIsPeopleDrawerOpen(true)}>
                                            Trocar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: CARRINHO */}
                            {cartTab === 'carrinho' && (
                                <>


                                    {Object.keys(cart).length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.8, marginTop: '40px' }}>
                                            <ShoppingCart size={48} color="#FFFFFF" style={{ marginBottom: '16px' }} />
                                            <p style={{ color: '#999999', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>Sua sacola está vazia.</p>
                                            <button 
                                                onClick={() => {
                                                    setIsCartOpen(false);
                                                    if (onTabChange) onTabChange('menu');
                                                }}
                                                style={{ background: '#FFFFFF', color: '#000000', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, fontSize: '12px', border: 'none' }}
                                            >
                                                FAZER PEDIDO
                                            </button>
                                        </div>
                                    ) : (
                                        Object.entries(cart).map(([key, qty]) => {
                                            const hasVariation = key.includes('-');
                                            let pid = key;
                                            let varName = null;
                                            if (hasVariation) {
                                                const parts = key.split('-');
                                                pid = parts[0];
                                                varName = parts.slice(1).join('-');
                                            }
                                            const pModel = allProductsRef.current.find(p => p.id === pid);
                                            if (!pModel) return null;

                                            let itemPrice = pModel.price;
                                            let itemImage = pModel.imageUrl;
                                            let displayVarName = null;

                                            if (hasVariation && pModel.variations && pModel.variations[varName]) {
                                                const varData = pModel.variations[varName];
                                                itemPrice = varData.price;
                                                displayVarName = varName;
                                                
                                                if (varData.imagem_url && varData.imagem_url.trim() !== '') {
                                                    itemImage = varData.imagem_url;
                                                }

                                                const isTaca = varName.toLowerCase().includes('taça') || varName.toLowerCase().includes('taca');
                                                if (pModel.tipo_vinho && isTaca && wineGlassImages[pModel.tipo_vinho]) {
                                                    itemImage = wineGlassImages[pModel.tipo_vinho];
                                                }
                                            }

                                            const hasObs = !!itemObservations[key];
                                            const isObsOpen = obsOpenFor === key;

                                            return (
                                                <div key={key} className="cart-item" style={{flexDirection: 'column', alignItems: 'stretch', gap: 0}}>
                                                    <div style={{display: 'flex', gap: '12px', alignItems: 'center', width: '100%'}}>
                                                        <div className="cart-item-image">
                                                            <img src={itemImage} alt={pModel.name} />
                                                        </div>
                                                        <div className="cart-item-info">
                                                            <div className="cart-item-title">{pModel.name}</div>
                                                            {displayVarName && <div className="cart-item-meta">{displayVarName}</div>}
                                                            <div className="cart-item-price">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemPrice)}
                                                            </div>
                                                        </div>
                                                        <div className="cart-item-actions">
                                                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                                <button 
                                                                    className={`cart-item-obs-toggle ${hasObs ? 'has-obs' : ''}`}
                                                                    onClick={() => setObsOpenFor(isObsOpen ? null : key)}
                                                                >
                                                                    <MessageSquare size={16} fill={hasObs ? "var(--accent-gold)" : "none"} />
                                                                </button>
                                                                <button className="cart-trash-btn" onClick={() => {
                                                                    setCart(prev => {
                                                                        const newC = { ...prev };
                                                                        delete newC[key];
                                                                        return newC;
                                                                    });
                                                                }}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="cart-qty-controls">
                                                                <button className="cart-qty-btn" onClick={() => {
                                                                    setCart(prev => ({ ...prev, [key]: Math.max(1, prev[key] - 1) }));
                                                                }}>
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="cart-qty-val">{qty}</span>
                                                                <button className="cart-qty-btn" onClick={() => {
                                                                    setCart(prev => ({ ...prev, [key]: prev[key] + 1 }));
                                                                }}>
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {isObsOpen && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                                            <input 
                                                                type="text" 
                                                                className="cart-item-obs-input" 
                                                                placeholder="Ex: Sem cebola, bem passado..."
                                                                value={itemObservations[key] || ''}
                                                                onChange={(e) => setItemObservations(prev => ({...prev, [key]: e.target.value}))}
                                                                autoFocus
                                                            />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}


                                    {/* UPSELL SECTION MOVED TO BOTTOM */}
                                    {Object.keys(cart).length > 0 && products.length > 0 && (
                                        <div className="cart-upsell-container">
                                            <h4 className="upsell-title">Que tal adicionar?</h4>
                                            <div className="upsell-scroll">
                                                <div className="upsell-marquee">
                                                    {(() => {
                                                        const availableForUpsell = allProductsRef.current.filter(p => !cart[p.id] && !Object.keys(cart).some(k => k.startsWith(p.id)) && p.id !== currentProduct?.id);
                                                        
                                                        // Sort raw list mostly by likes, but not completely to allow interleaving
                                                        const sortedByLikes = [...availableForUpsell].sort((a, b) => (b.curtidas || 0) - (a.curtidas || 0));
                                                        
                                                        // Interleaving approach: we want an alternating pattern of categories
                                                        // like: Petisco -> Drink -> Cerveja/Combo -> Pastel -> repeat
                                                        
                                                        const interleaved = [];
                                                        const grouped = {
                                                            petiscos: sortedByLikes.filter(p => p.category === 'Petiscos'),
                                                            drinks: sortedByLikes.filter(p => p.category === 'Drinks' || p.category === 'Gins'),
                                                            cervejas: sortedByLikes.filter(p => p.category === 'Cervejas' || p.category === 'Destilados' || p.category === 'Combos'),
                                                            pasteis: sortedByLikes.filter(p => p.category === 'Pastéis' || p.category === 'Sobremesas'),
                                                            outros: sortedByLikes.filter(p => !['Petiscos', 'Drinks', 'Gins', 'Cervejas', 'Destilados', 'Combos', 'Pastéis', 'Sobremesas'].includes(p.category))
                                                        };
                                                        
                                                        const maxLoops = Math.max(grouped.petiscos.length, grouped.drinks.length, grouped.cervejas.length, grouped.pasteis.length, grouped.outros.length);
                                                        
                                                        for (let i = 0; i < maxLoops; i++) {
                                                            if (grouped.petiscos[i]) interleaved.push(grouped.petiscos[i]);
                                                            if (grouped.drinks[i]) interleaved.push(grouped.drinks[i]);
                                                            if (grouped.pasteis[i]) interleaved.push(grouped.pasteis[i]);
                                                            if (grouped.cervejas[i]) interleaved.push(grouped.cervejas[i]);
                                                            if (grouped.outros[i]) interleaved.push(grouped.outros[i]);
                                                            
                                                            // We just need around 10-12 items max to keep UI smooth and performant
                                                            if (interleaved.length >= 10) break;
                                                        }

                                                        // Fallback just in case everything was empty (edge case)
                                                        if (interleaved.length === 0) {
                                                            return sortedByLikes.slice(0, 8);
                                                        }
                                                        
                                                        return interleaved;
                                                    })().map(p => (
                                                            <div key={p.id} className="upsell-item" onClick={() => {
                                                                setCart(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
                                                            }}>
                                                                <div className="upsell-img-box">
                                                                    <img src={p.imageUrl} alt={p.name} />
                                                                </div>
                                                                <div className="upsell-info">
                                                                    <span className="upsell-name">{p.name}</span>
                                                                    <span className="upsell-price">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                                                                    </span>
                                                                </div>
                                                                <div className="upsell-add-icon">+</div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* TAB: MEUS PEDIDOS */}
                            {cartTab === 'pedidos' && (
                                <div className="order-history-container">
                                    {isFetchingHistory && orderHistory.length === 0 ? (
                                        <div className="order-history-empty">
                                            <Loader2 size={32} color="var(--accent-gold)" className="animate-spin" />
                                            <p>Carregando histórico...</p>
                                        </div>
                                    ) : orderHistory.length === 0 ? (
                                        <div className="order-history-empty">
                                            <Receipt size={48} color="#444" />
                                            <p>Nenhum pedido confirmado ainda.</p>
                                        </div>
                                    ) : (
                                        orderHistory.map(pedido => {
                                            const items = pedido.itens_pedido || [];
                                            // Timeline status mapping (1=recebido, 2=preparando, 3=pronto, 4=servido)
                                            let currentStep = 1;
                                            if (pedido.status === 'preparando') currentStep = 2;
                                            if (pedido.status === 'pronto') currentStep = 3;
                                            if (pedido.status === 'servido') currentStep = 4;

                                            return (
                                                <div key={pedido.id} className="order-card">
                                                    <div className="order-card-header">
                                                        <span className="order-card-id">Pedido #{pedido.id.toString().substring(0, 5)}</span>
                                                        <span className="order-card-time">
                                                            <Clock size={12} style={{display:'inline', marginRight:'4px'}}/>
                                                            {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>

                                                    <div className="order-timeline">
                                                        {['Recebido', 'Preparando', 'Servido', 'Concluído'].map((label, idx) => {
                                                            const stepNum = idx + 1;
                                                            const isDone = stepNum < currentStep;
                                                            const isCurrent = stepNum === currentStep;
                                                            return (
                                                                <div key={label} className={`timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                                                    <div className="timeline-line" />
                                                                    <div className="timeline-dot" />
                                                                    <span className="timeline-label">{label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="order-card-items">
                                                        {items.map(it => (
                                                            <div key={it.id} style={{display:'flex', flexDirection:'column', gap: '2px'}}>
                                                                <div className="order-card-item-row">
                                                                    <span className="order-card-item-name">
                                                                        <span className="order-card-item-qty">{it.quantidade}x</span>
                                                                        {it.nome_produto} {it.nome_variacao ? `(${it.nome_variacao})` : ''}
                                                                    </span>
                                                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.preco_total)}</span>
                                                                </div>
                                                                {it.observacao && (
                                                                    <span className="order-card-item-obs">"{it.observacao}"</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="order-card-total">
                                                        <span>Total do Pedido</span>
                                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                        </div>

                        {/* FOOTER SECTION (Service Buttons + Subtotal + Checkout) */}
                        <div style={{ background: '#000000', borderTop: 'none', position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: '12px', zIndex: 100 }}>
                            <div className="cart-service-buttons">
                                <button 
                                    className={`service-btn ${(garcomCalled || garcomCooldown) ? 'active' : ''}`}
                                    onClick={() => handleCallService('garcom')}
                                    disabled={garcomCooldown || garcomCalled}
                                >
                                    <Bell size={16} /> 
                                    {garcomCalled ? "Garçom Chamado" : "Chamar Garçom"}
                                </button>
                                <button 
                                    className={`service-btn ${(contaCalled || contaCooldown) ? 'active' : ''}`}
                                    onClick={() => handleCallService('conta')}
                                    disabled={contaCooldown || contaCalled}
                                >
                                    <Receipt size={16} /> 
                                    {contaCalled ? "Conta Solicitada" : "Fechar Conta"}
                                </button>
                            </div>

                            {cartTab === 'carrinho' && (
                                <div className="cart-footer" style={{position: 'relative', bottom: 'auto', borderTop: 'none'}}>
                                    <div className="cart-subtotal-row" style={{marginBottom: '10px'}}>
                                        <span className="cart-subtotal-label">Total do Pedido</span>
                                        <span className="cart-subtotal-value">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                Object.entries(cart).reduce((sum, [key, qty]) => {
                                                    const hasVariation = key.includes('-');
                                                    const pid = hasVariation ? key.split('-')[0] : key;
                                                    const varName = hasVariation ? key.split('-').slice(1).join('-') : null;
                                                    const pModel = allProductsRef.current.find(p => p.id === pid);
                                                    if (!pModel) return sum;
                                                    let currentPrice = pModel.price;
                                                    if (hasVariation && pModel.variations && pModel.variations[varName]) {
                                                        currentPrice = pModel.variations[varName].price;
                                                    }
                                                    return sum + (currentPrice * qty);
                                                }, 0)
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        className="checkout-btn"
                                        onClick={() => {
                                        if (!pessoaAtiva) {
                                            setIsPeopleDrawerOpen(true);
                                            return;
                                        }
                                        handleCheckout();
                                        }}
                                        disabled={Object.keys(cart).length === 0 || isCheckingOut}
                                        style={{ 
                                            opacity: (Object.keys(cart).length === 0 || isCheckingOut) ? 0.5 : 1,
                                            animation: (Object.keys(cart).length > 0 && !isCheckingOut) ? 'pulse-gold-border 2s infinite' : 'none'
                                        }}
                                    >
                                        {isCheckingOut ? (
                                            <><Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> ENVIANDO...</>
                                        ) : (
                                            <>FINALIZAR PEDIDO</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {cartTab === 'pedidos' && (
                                <div className="cart-footer" style={{position: 'relative', bottom: 'auto', borderTop: 'none', padding: '0 20px 24px'}}>
                                    <div className="cart-subtotal-row" style={{marginBottom: 0}}>
                                        <span className="cart-subtotal-label">Total da sua comanda</span>
                                        <span className="cart-subtotal-value">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                orderHistory.reduce((sum, ped) => sum + ped.total, 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SUCCESS SCREEN */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100000] bg-black flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, transition: { delay: 0.2, type: 'spring' } }}
                            className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
                        >
                            <Check className="w-12 h-12 text-green-500" />
                        </motion.div>
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            Pedido Realizado!
                        </motion.h2>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
                            className="text-gray-400 mb-8 max-w-[280px]"
                        >
                            Seu pedido já está na cozinha e logo chegará até você.
                        </motion.p>
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: 0.6 } }}
                            onClick={() => {
                                setOrderSuccess(false);
                                onTabChange?.('pedidos');
                            }}
                            className="w-full max-w-[280px] h-[50px] bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm outline-none active:scale-[0.98] transition-transform"
                        >
                            Acompanhar Pedido
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PEOPLE SELECTOR DRAWER */}
            <AnimatePresence>
                {isPeopleDrawerOpen && (
                    <motion.div
                        className="people-drawer-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setIsPeopleDrawerOpen(false);
                        }}
                    >
                        <motion.div
                            className="people-drawer-content"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="people-drawer-header">
                                <h3 className="people-drawer-title">Pra qual comanda?</h3>
                                <button onClick={() => setIsPeopleDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {isAddMode ? (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                    <input 
                                        type="text"
                                        className="cart-person-input"
                                        placeholder="Digite o novo nome..."
                                        value={novaPessoaNome}
                                        onChange={(e) => setNovaPessoaNome(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const btn = document.getElementById('people-ok-btn');
                                                if(btn) btn.click();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button 
                                        id="people-ok-btn"
                                        type="button"
                                        className="cart-person-btn"
                                        onClick={() => {
                                            if (novaPessoaNome.trim()) {
                                                setPessoaAtiva(novaPessoaNome.trim());
                                                setIsPeopleDrawerOpen(false);
                                                
                                                if (pendingProductToAdd) {
                                                    const { product, qty, variation } = pendingProductToAdd;
                                                    setCart(prev => ({
                                                        ...prev,
                                                        [variation ? `${product.id}-${variation}` : product.id]: (prev[variation ? `${product.id}-${variation}` : product.id] || 0) + qty
                                                    }));
                                                    setPendingProductToAdd(null);
                                                    setPendingQty(1);
                                                    setIsCartOpen(true);
                                                    setCartTab('carrinho');
                                                    if (onTabChange) onTabChange('sacola');
                                                } else if (isCartPending) {
                                                    setIsCartPending(false);
                                                    setCartTab('carrinho');
                                                    setIsCartOpen(true);
                                                    if (onTabChange) onTabChange('sacola');
                                                }
                                            }
                                        }}
                                    >
                                        OK
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="people-list">
                                        {isFetchingPessoas ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', color: '#888' }}>
                                                <Loader2 size={24} className="animate-spin" />
                                            </div>
                                        ) : pessoasNaMesa.length > 0 ? (
                                            pessoasNaMesa.map((nome, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`person-item ${pessoaAtiva === nome ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPessoaAtiva(nome);
                                                        setIsPeopleDrawerOpen(false);
                                                        if (pendingProductToAdd) {
                                                            const { product, qty, variation } = pendingProductToAdd;
                                                            setCart(prev => ({
                                                                ...prev,
                                                                [variation ? `${product.id}-${variation}` : product.id]: (prev[variation ? `${product.id}-${variation}` : product.id] || 0) + qty
                                                            }));
                                                            setPendingProductToAdd(null);
                                                            setPendingQty(1);
                                                            setIsCartOpen(true);
                                                            setCartTab('carrinho');
                                                            if (onTabChange) onTabChange('sacola');
                                                        } else if (isCartPending) {
                                                            setIsCartPending(false);
                                                            setCartTab('carrinho');
                                                            setIsCartOpen(true);
                                                            if (onTabChange) onTabChange('sacola');
                                                        }
                                                    }}
                                                >
                                                    <Users size={16} />
                                                    {nome}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                                                Nenhuma comanda aberta nesta mesa ainda.
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        className="checkout-btn" 
                                        style={{ background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
                                        onClick={() => setIsAddMode(true)}
                                    >
                                        <Plus size={16} /> ADICIONAR NOVA COMANDA
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default App;
