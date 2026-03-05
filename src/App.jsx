import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowLeft, Loader2, Heart, Users, Droplet } from 'lucide-react';
import { supabase } from './lib/supabase';

// Cloudinary URL optimizer: injects format/quality/width transforms
const optimizeCloudinaryUrl = (url, width = 450) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
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

const countryFlags = {
    'Brasil': '/flags/brasil.png',
    'Escócia': '/flags/escocia.png',
    'Reino Unido': '/flags/reino_unido.png',
    'Inglaterra': '/flags/reino_unido.png',
    'México': '/flags/mexico.png',
    'EUA': '/flags/eua.png',
    'Estados Unidos (EUA)': '/flags/eua.png',
    'Itália': '/flags/Italia 100x60.png',
    'Portugal': '/flags/Portugal 100x60.png',
    'França': '/flags/franca.png',
    'Holanda': '/flags/holanda.png',
    'Suécia': '/flags/Suecia 100x60.png',
    'Alemanha': '/flags/Bandeira Alemanha 100x60.png',
    'Espanha': '/flags/Espanha 100x60.png',
    'Japão': '/flags/Japão 100x60.png',
    'Polônia': '/flags/Polonia 100x60.png',
    'Porto Rico': '/flags/Porto Rico 100x60.png',
    'Rússia': '/flags/Russia 100x60.png',
    'Cuba': '/flags/Cuba 100x60.png',
    'Áustria': '/flags/Austria 100x60.png',
    'África do Sul': '/flags/África do Sul 100x60.png',
    'Bélgica': '/flags/belgica.png',
    'Suíça': '/flags/Suica 100x60.png'
};

const App = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 = right, -1 = left
    const [isInternalSpin, setIsInternalSpin] = useState(false); // true when clicking a flavor button
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [cart, setCart] = useState({}); // { productId: quantity }
    const [pendingQty, setPendingQty] = useState(1); // local qty before adding to cart
    const [flyingItems, setFlyingItems] = useState([]); // for fly-to-cart animation
    const [heartParticles, setHeartParticles] = useState([]); // for heart burst effect
    const [wineGlassImages, setWineGlassImages] = useState({}); // { tinto: url, branco: url, rose: url }
    const cartIconRef = useRef(null);

    const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    const currentProduct = products.length > 0 ? products[currentIndex] : null;

    // Fetch Products and their Variants from Supabase
    const fetchMenu = useCallback(async (isInitial = false) => {
        try {
            // Fetch categories to map names to products
            const { data: catData, error: catError } = await supabase
                .from('categorias')
                .select('id, nome, icone')
                .eq('ativo', true);

            if (catError) throw catError;

            const catMap = catData.reduce((acc, cat) => {
                acc[cat.id] = cat.nome;
                return acc;
            }, {});

            // Fetch products that are available
            const { data: prodData, error: prodError } = await supabase
                .from('produtos')
                .select('*')
                .eq('disponivel', true)
                .order('ordem', { ascending: true });

            if (prodError) throw prodError;

            // Fetch active variants
            const { data: varData, error: varError } = await supabase
                .from('variacoes_produto')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true });

            if (varError) throw varError;

            // Fetch wine glass images
            const { data: wineData, error: wineError } = await supabase
                .from('tipos_vinho')
                .select('tipo, imagem_taca_url');

            let glassMapToPreload = null;
            if (!wineError && wineData) {
                const glassMap = {};
                wineData.forEach(w => { glassMap[w.tipo] = optimizeCloudinaryUrl(w.imagem_taca_url); });
                setWineGlassImages(glassMap);
                glassMapToPreload = glassMap;
            }

            // Reconstruct the data shape expected by the frontend
            const enrichedProducts = prodData.map(p => {
                const myVariants = varData.filter(v => v.produto_id === p.id);

                // Organize variants dict
                let varsDict = null;
                let defaultPrice = 0;

                if (myVariants.length > 0) {
                    varsDict = {};
                    myVariants.forEach(v => {
                        varsDict[v.nome] = {
                            id: v.id,
                            price: v.preco,
                            stock: v.estoque
                        };
                    });
                    defaultPrice = myVariants[0].preco;
                }

                // Visual properties linked by slug
                const categoryName = catMap[p.categoria_id] || 'Outros';

                return {
                    id: p.id,
                    slug: p.slug,
                    name: p.nome,
                    categoryId: p.categoria_id,
                    category: categoryName,
                    description: p.descricao,
                    imageUrl: optimizeCloudinaryUrl(p.imagem_url),
                    price: defaultPrice,
                    variations: varsDict,
                    flagUrl: p.pais_origem ? countryFlags[p.pais_origem] : null,
                    paisOrigem: p.pais_origem || null,
                    rating: p.rating || 5.0,
                    volume_ml: p.volume_ml,
                    teor_alcolico: p.teor_alcolico,
                    serve_pessoas: p.serve_pessoas,
                    curtidas: p.curtidas || 0,
                    tipo_vinho: p.tipo_vinho || null,
                    ml_taca: p.ml_taca || 200
                };
            });

            // Preload only on initial load
            if (isInitial) {
                const flagsToPreload = new Set();
                enrichedProducts.forEach(p => {
                    if (p.flagUrl) flagsToPreload.add(p.flagUrl);
                });
                flagsToPreload.forEach(url => {
                    const img = new Image();
                    img.src = url;
                });
                enrichedProducts.slice(0, 3).forEach(p => {
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

            setProducts(enrichedProducts);
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

    // Realtime subscriptions: auto-refresh on any DB change
    useEffect(() => {
        const channel = supabase
            .channel('menu-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => fetchMenu())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'variacoes_produto' }, () => fetchMenu())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => fetchMenu())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tipos_vinho' }, () => fetchMenu())
            .subscribe();

        return () => {
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
        setIsInternalSpin(false); // Arrow/swipe is not an internal spin
        // Circular navigation
        let nextIndex = currentIndex + newDirection;

        // Helper to check if a product is a "master" or standalone
        const isValidMaster = (prod) => {
            if (!prod) return false;
            // It's a flavor but NOT the master flavor -> Skip it
            if (prod.slug?.startsWith('ice-') && prod.slug !== 'ice-limao') return false;
            if (prod.slug?.startsWith('skol-beats-') && prod.slug !== 'skol-beats-senses') return false;

            return true;
        };

        // Advance until we find a master product or normal product
        while (true) {
            if (nextIndex < 0) nextIndex = products.length - 1;
            if (nextIndex >= products.length) nextIndex = 0;

            if (isValidMaster(products[nextIndex])) {
                break;
            }
            nextIndex += newDirection;
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
        enter: ({ direction, isFood, isIce, isSkolBeats, isInternalSpin, isWineSpin }) => {
            const isCircular = isFood || ((isIce || isSkolBeats) && isInternalSpin) || isWineSpin;
            return {
                x: direction > 0 ? (isCircular ? 150 : 50) : (isCircular ? -150 : -50),
                y: isCircular ? 50 : 0,
                rotate: isCircular ? (direction > 0 ? 15 : -15) : 0,
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
        exit: ({ direction, isFood, isIce, isSkolBeats, isInternalSpin, isWineSpin }) => {
            const isCircular = isFood || ((isIce || isSkolBeats) && isInternalSpin) || isWineSpin;
            return {
                zIndex: 0,
                x: direction < 0 ? (isCircular ? 150 : 50) : (isCircular ? -150 : -50),
                y: isCircular ? 50 : 0,
                rotate: isCircular ? (direction < 0 ? 15 : -15) : 0,
                opacity: 0,
            };
        },
    };

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111' }}>
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    if (!currentProduct) {
        return (
            <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111', color: '#fff' }}>
                <p>Nenhum produto disponível no momento.</p>
            </div>
        );
    }

    // Format current price
    let displayPrice = currentProduct.price;
    if (currentProduct.variations && selectedVariation && currentProduct.variations[selectedVariation]) {
        displayPrice = currentProduct.variations[selectedVariation].price;
    }
    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice);

    const isTaca = selectedVariation && (selectedVariation.toLowerCase().includes('taça') || selectedVariation.toLowerCase().includes('taca'));
    let displayImage = currentProduct.imageUrl;
    if (currentProduct.tipo_vinho && isTaca && wineGlassImages[currentProduct.tipo_vinho]) {
        displayImage = wineGlassImages[currentProduct.tipo_vinho];
    }

    // Swap volume: show ml_taca when Taça is selected
    const displayVolume = (currentProduct.tipo_vinho && isTaca) ? currentProduct.ml_taca : currentProduct.volume_ml;


    return (
        <div className="app-container" style={{
            background: `url('https://res.cloudinary.com/ddhlqymvf/image/upload/f_auto,q_auto,w_450/v1771525899/App_Bar_1080x1920_2_afm0f1.png') center/cover no-repeat`,
            transition: 'background 0.5s ease-in-out'
        }}>
            {/* Background Tint Overlay */}
            <div className="tint-layer" />

            {/* FIXED TOP NAV */}
            <div className="top-nav">
                <ArrowLeft className="icon" />
                <div className="page-title">{currentProduct.category}</div>
                <div ref={cartIconRef} style={{ position: 'relative' }}>
                    <ShoppingCart className="icon" />
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

            {/* ANIMATED HERO SECTION */}
            <div className="hero">
                <AnimatePresence initial={false} custom={{ direction, isFood: currentProduct?.category === 'Petiscos', isIce: currentProduct?.slug?.startsWith('ice-'), isSkolBeats: currentProduct?.slug?.startsWith('skol-beats-'), isInternalSpin, isWineSpin: isInternalSpin && currentProduct?.category?.toLowerCase().includes('vinho') }}>
                    <motion.div
                        key={`${currentProduct.id}-${selectedVariation || ''}`}
                        custom={{ direction, isFood: currentProduct?.category === 'Petiscos', isIce: currentProduct?.slug?.startsWith('ice-'), isSkolBeats: currentProduct?.slug?.startsWith('skol-beats-'), isInternalSpin, isWineSpin: isInternalSpin && currentProduct?.category?.toLowerCase().includes('vinho') }}
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
                        {/* FLAG OVERLAY / PAIS ORIGEM */}
                        {(currentProduct.flagUrl || currentProduct.paisOrigem) && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '2px',
                                marginBottom: '2px',
                                zIndex: 10
                            }}>
                                {currentProduct.flagUrl && (
                                    <img
                                        src={currentProduct.flagUrl}
                                        alt="Origin Flag"
                                        style={{
                                            width: '24px', /* Menor conforme pedido */
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
                        )}

                        {/* FIXED HEIGHT TITLE CONTAINER TO PREVENT IMAGE SHIFTING ON LONG NAMES */}
                        <div style={{
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '90%',
                            marginBottom: '5px',
                            zIndex: 5
                        }}>
                            <h1 style={{
                                fontFamily: 'Playfair Display, serif',
                                fontSize: '24px',
                                fontWeight: 900,
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                textAlign: 'center',
                                lineHeight: '1.2'
                            }}>
                                {currentProduct.name}
                            </h1>
                        </div>

                        <div style={{ position: 'relative', width: '100%', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '5px' }}>
                            {/* Back Glow */}
                            <div style={{
                                position: 'absolute', width: '200px', height: '200px',
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                                borderRadius: '50%', zIndex: 0
                            }} />

                            <img
                                src={displayImage}
                                alt={currentProduct.name}
                                style={{
                                    maxHeight: '90%',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    zIndex: 2
                                }}
                            />

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
                <div style={{ position: 'absolute', top: '75px', right: '15px', zIndex: 100 }}>
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
                            }
                        }}
                        style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Heart
                            size={22}
                            color="#444"
                            fill={currentProduct.curtidas > 0 ? "#444" : "transparent"}
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                        />
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
                            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', width: '100%', marginTop: '4px', position: 'relative' }}>
                                {/* Left Container: Rating & Category */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                                    <div className="rating" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const effectiveRating = currentProduct.rating || 5;
                                            const isFull = star <= effectiveRating;
                                            const isHalf = !isFull && star - 0.5 <= effectiveRating;

                                            return (
                                                <span
                                                    key={star}
                                                    className={`star ${!isFull && !isHalf ? 'inactive' : ''}`}
                                                    style={{
                                                        fontSize: '11px',
                                                        position: 'relative',
                                                        display: 'inline-block',
                                                        color: isFull ? '#D4AF37' : (isHalf ? 'transparent' : '#333'),
                                                        backgroundImage: isHalf ? 'linear-gradient(90deg, #D4AF37 50%, #333 50%)' : 'none',
                                                        WebkitBackgroundClip: isHalf ? 'text' : 'none',
                                                        MozBackgroundClip: isHalf ? 'text' : 'none',
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
                                        src="https://res.cloudinary.com/ddhlqymvf/image/upload/v1772656206/Logotipo_2_odktzy.png"
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
                                    <div className="price-tag" style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', fontSize: '14px', fontWeight: '800' }}>
                                        {formattedPrice}
                                    </div>
                                </div>
                            </div>

                            <div className="info-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                <div className="product-name" style={{ fontSize: '20px', textAlign: 'center' }}>
                                    {currentProduct.name}
                                </div>
                            </div>

                            {/* ELITE METADATA LINE */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px', opacity: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
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
                                marginBottom: '10px',
                                fontSize: '12px',
                                color: '#ccc',
                                textAlign: 'center',
                                lineHeight: '1.4'
                            }}>
                                {currentProduct.description}
                            </p>

                            {/* MULTI-FLAVOR / VARIATION SELECTION (HORIZONTAL SCROLL STYLE) */}
                            {((currentProduct.variations && Object.keys(currentProduct.variations).length > 1) ||
                                (currentProduct.slug && (currentProduct.slug.startsWith('ice-') || currentProduct.slug.startsWith('skol-beats-')))) && (
                                    <div style={{ marginTop: '0px', marginBottom: '20px', width: '100%' }}>
                                        <div style={{
                                            textAlign: 'center',
                                            fontSize: '9px',
                                            fontWeight: '800',
                                            color: '#D4AF37',
                                            letterSpacing: '1.2px',
                                            textTransform: 'uppercase',
                                            marginBottom: '10px'
                                        }}>
                                            Escolha sua Opção
                                        </div>
                                        <div
                                            className="flavors-grid"
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '0 5px'
                                            }}
                                        >

                                            {/* OPTION 1: SLUG-BASED (ICES & SKOL BEATS) */}
                                            {currentProduct.slug && (currentProduct.slug.startsWith('ice-') || currentProduct.slug.startsWith('skol-beats-')) ? (
                                                (currentProduct.slug.startsWith('ice-')
                                                    ? ['Limão', 'Balada', 'Fruit Mix', 'Kiwi', 'Maracujá', 'Tangerina']
                                                    : ['Senses', 'Gin e Tônica', 'Tropical', 'Red Mix', 'Green Mix']
                                                ).map((flavor, flavorIdx) => {
                                                    const baseSlug = currentProduct.slug.startsWith('ice-') ? 'ice' : 'skol-beats';
                                                    const flavorsArray = currentProduct.slug.startsWith('ice-')
                                                        ? ['Limão', 'Balada', 'Fruit Mix', 'Kiwi', 'Maracujá', 'Tangerina']
                                                        : ['Senses', 'Gin e Tônica', 'Tropical', 'Red Mix', 'Green Mix'];

                                                    let cleanFlavor = flavor.toLowerCase().replace(/ã/g, 'a').replace(/á/g, 'a').replace(/ô/g, 'o').replace(/ /g, '-');
                                                    if (flavor === 'Gin e Tônica') cleanFlavor = 'gin-tonica';

                                                    const flavorSlug = `${baseSlug}-${cleanFlavor}`;
                                                    const isSelected = currentProduct.slug === flavorSlug;

                                                    const currentFlavorIdx = flavorsArray.findIndex(f => {
                                                        let cf = f.toLowerCase().replace(/ã/g, 'a').replace(/á/g, 'a').replace(/ô/g, 'o').replace(/ /g, '-');
                                                        if (f === 'Gin e Tônica') cf = 'gin-tonica';
                                                        return `${baseSlug}-${cf}` === currentProduct.slug;
                                                    });

                                                    return (
                                                        <button
                                                            key={flavor}
                                                            onClick={() => {
                                                                const targetIndex = products.findIndex(p => p.slug === flavorSlug);
                                                                if (targetIndex !== -1 && targetIndex !== currentIndex) {
                                                                    const spinDirection = flavorIdx > currentFlavorIdx ? 1 : -1;
                                                                    setDirection(spinDirection);
                                                                    setIsInternalSpin(true);
                                                                    setTimeout(() => setCurrentIndex(targetIndex), 0);
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '8px 14px',
                                                                borderRadius: '18px',
                                                                border: `1.1px solid ${isSelected ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                                                                background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                color: isSelected ? '#D4AF37' : '#999',
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer',
                                                                boxShadow: isSelected ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none'
                                                            }}
                                                        >
                                                            {flavor}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                /* OPTION 2: VARIATIONS (OTHER PRODUCTS) */
                                                Object.keys(currentProduct.variations).map((variant, variantIdx) => {
                                                    const isSelected = selectedVariation === variant;
                                                    return (
                                                        <button
                                                            key={variant}
                                                            onClick={() => {
                                                                const isWine = currentProduct.category && currentProduct.category.toLowerCase().includes('vinho');
                                                                if (isWine && selectedVariation !== variant) {
                                                                    const currentVariantIdx = Object.keys(currentProduct.variations).indexOf(selectedVariation);
                                                                    setDirection(variantIdx > currentVariantIdx ? 1 : -1);
                                                                    setIsInternalSpin(true);
                                                                }
                                                                setSelectedVariation(variant);
                                                            }}
                                                            style={{
                                                                padding: '8px 14px',
                                                                borderRadius: '18px',
                                                                border: `1.1px solid ${isSelected ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                                                                background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                color: isSelected ? '#D4AF37' : '#999',
                                                                fontSize: '11px',
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

                    return (
                        <div className="sheet-footer">
                            <div className="super-pill">
                                <div className="qty-controls-integrated">
                                    <button
                                        className={`qty-ball ${pendingQty <= 1 ? 'disabled' : ''}`}
                                        onClick={() => setPendingQty(q => Math.max(1, q - 1))}
                                        disabled={pendingQty <= 1}
                                    >
                                        −
                                    </button>
                                    <span className="qty-number">{pendingQty}</span>
                                    <button
                                        className="qty-ball"
                                        onClick={() => setPendingQty(q => q + 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    className="add-btn"
                                    onClick={(e) => {
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
                                            setTimeout(() => {
                                                setCart(prev => ({
                                                    ...prev,
                                                    [currentProduct.id]: (prev[currentProduct.id] || 0) + addQty
                                                }));
                                                setFlyingItems(prev => prev.filter(f => f.id !== id));
                                            }, 600);
                                        } else {
                                            setCart(prev => ({
                                                ...prev,
                                                [currentProduct.id]: (prev[currentProduct.id] || 0) + addQty
                                            }));
                                        }
                                        setPendingQty(1);
                                    }}
                                >
                                    <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>ADICIONAR</span>
                                    <span style={{ fontWeight: '900', fontSize: '14px', marginLeft: '8px', whiteSpace: 'nowrap' }}>{itemTotal}</span>
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
                        background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
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
        </div>
    );
};

export default App;
