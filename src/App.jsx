import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowLeft, Loader2, Heart, Users, Droplet, Plus, Minus, Trash2, X } from 'lucide-react';
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
    const [isCartOpen, setIsCartOpen] = useState(false); // Controls the cart overlay
    const [isCheckingOut, setIsCheckingOut] = useState(false); // Loading state for checkout
    const [orderSuccess, setOrderSuccess] = useState(false); // Success screen after order
    const cartIconRef = useRef(null);

    // NEW COMANDAS STATE
    const [pessoaAtiva, setPessoaAtiva] = useState(() => localStorage.getItem('@Menu-PessoaAtiva') || '');
    const [isPeopleDrawerOpen, setIsPeopleDrawerOpen] = useState(false);
    const [pessoasNaMesa, setPessoasNaMesa] = useState([]);
    const [isFetchingPessoas, setIsFetchingPessoas] = useState(false);
    const [novaPessoaNome, setNovaPessoaNome] = useState('');
    const [isAddMode, setIsAddMode] = useState(false);

    // PERSIST PERSON ON DEVICE
    useEffect(() => {
        if (pessoaAtiva) {
            localStorage.setItem('@Menu-PessoaAtiva', pessoaAtiva);
        } else {
            localStorage.removeItem('@Menu-PessoaAtiva');
        }
    }, [pessoaAtiva]);

    // FETCH EXISTING COMANDAS ON THIS TABLE
    const fetchPessoasNaMesa = useCallback(async () => {
        setIsFetchingPessoas(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const mesaNum = parseInt(params.get('mesa'), 10) || 1;

            const { data: mesaData } = await supabase.from('mesas').select('id').eq('numero', mesaNum).single();
            if (!mesaData) return;

            const { data: openComanda } = await supabase.from('comandas').select('id').eq('mesa_id', mesaData.id).eq('status', 'aberta').maybeSingle();
            if (!openComanda) {
                setPessoasNaMesa(pessoaAtiva ? [pessoaAtiva] : []);
                return;
            }

            const { data: pessoasData } = await supabase.from('pessoas_comanda').select('nome').eq('comanda_id', openComanda.id);
            if (pessoasData) {
                let nomes = pessoasData.map(p => p.nome).filter(n => n && n !== 'Cliente');
                
                if (pessoaAtiva && !nomes.includes(pessoaAtiva) && pessoaAtiva !== 'Cliente') {
                    nomes.unshift(pessoaAtiva);
                }
                
                nomes = [...new Set(nomes)];
                setPessoasNaMesa(nomes);
            }
        } catch (e) {
            console.error("Erro fetch Pessoas", e);
        } finally {
            setIsFetchingPessoas(false);
        }
    }, [pessoaAtiva]);

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

    // CHECKOUT LOGIC — Creates order in Supabase
    const handleCheckout = async () => {
        if (Object.keys(cart).length === 0 || isCheckingOut) return;
        setIsCheckingOut(true);

        try {
            // 1. Get mesa number from URL
            const params = new URLSearchParams(window.location.search);
            const mesaNum = parseInt(params.get('mesa'), 10) || 1;

            // 2. Look up mesa_id by numero
            const { data: mesaData, error: mesaError } = await supabase
                .from('mesas')
                .select('id')
                .eq('numero', mesaNum)
                .single();

            if (mesaError || !mesaData) throw new Error(`Mesa ${mesaNum} não encontrada.`);
            const mesaId = mesaData.id;

            // 3. Find or create an open comanda for this mesa
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

            // 4. Create ou Find pessoa_comanda (Use real nome_pessoa)
            let pessoaId;
            const nomeFinal = pessoaAtiva || 'Cliente';
            
            const { data: existingPessoa } = await supabase
                .from('pessoas_comanda')
                .select('id')
                .eq('comanda_id', comandaId)
                .eq('nome', nomeFinal)
                .maybeSingle();

            if (existingPessoa) {
                pessoaId = existingPessoa.id;
            } else {
                const { data: pessoa, error: pessoaErr } = await supabase
                    .from('pessoas_comanda')
                    .insert({ comanda_id: comandaId, nome: nomeFinal })
                    .select('id')
                    .single();
                if (pessoaErr) throw pessoaErr;
                pessoaId = pessoa.id;
            }

            // 5. Calculate total and build itens array
            let totalVal = 0;
            const itensList = [];

            Object.entries(cart).forEach(([key, qty]) => {
                const hasVariation = key.includes('-');
                const pid = hasVariation ? key.split('-')[0] : key;
                const varName = hasVariation ? key.split('-').slice(1).join('-') : null;
                const pModel = products.find(p => p.id === pid);

                if (pModel) {
                    let currentPrice = pModel.price;
                    let varId = null;
                    let displayVarName = null;

                    if (hasVariation && pModel.variations && pModel.variations[varName]) {
                        currentPrice = pModel.variations[varName].price;
                        varId = pModel.variations[varName].id;
                        displayVarName = varName;
                    }

                    totalVal += currentPrice * qty;

                    itensList.push({
                        produto_id: pid,
                        variacao_id: varId,
                        nome_produto: pModel.name,
                        nome_variacao: displayVarName,
                        quantidade: qty,
                        preco_unitario: currentPrice,
                        preco_total: currentPrice * qty,
                    });
                }
            });

            // 6. Insert pedido
            const { data: pedido, error: pedidoErr } = await supabase
                .from('pedidos')
                .insert({
                    comanda_id: comandaId,
                    pessoa_id: pessoaId,
                    numero_mesa: mesaNum,
                    nome_pessoa: nomeFinal,
                    status: 'recebido',
                    total: totalVal,
                })
                .select('id')
                .single();
            if (pedidoErr) throw pedidoErr;

            // 7. Insert itens_pedido
            const itensWithPedidoId = itensList.map(item => ({
                ...item,
                pedido_id: pedido.id,
            }));

            const { error: itensErr } = await supabase
                .from('itens_pedido')
                .insert(itensWithPedidoId);
            if (itensErr) throw itensErr;

            // 8. Success! Clear cart and show success screen
            setCart({});
            setIsCartOpen(false);
            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 4000);

        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            alert('Erro ao enviar pedido. Tente novamente.');
        } finally {
            setIsCheckingOut(false);
        }
    };

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
                <div ref={cartIconRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsCartOpen(true)}>
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

                        {/* TITLE CONTAINER - AUTO HEIGHT FOR BALANCE */}
                        <div style={{
                            padding: '0 20px',
                            textAlign: 'center',
                            width: '90%',
                            marginBottom: '10px',
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
                <div style={{ position: 'absolute', top: '65px', right: '15px', zIndex: 100 }}>
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
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', width: '100%', marginTop: '4px', position: 'relative' }}>
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
                                            color: 'var(--accent-gold)',
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
                                                                border: `1.1px solid ${isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}`,
                                                                background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                color: isSelected ? 'var(--accent-gold)' : '#999',
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

                    let currentStock = -1; // Default -1 means unlimited
                    if (currentProduct.variations && selectedVariation && currentProduct.variations[selectedVariation]) {
                        currentStock = currentProduct.variations[selectedVariation].stock;
                    }

                    const isOutOfStock = currentStock === 0;

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
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="cart-header">
                            <span className="cart-title">Carrinho</span>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="cart-items-container">
                            {/* PEOPLE GROUPING IDENTIFIER */}
                            {Object.keys(cart).length > 0 && (
                                <div className="cart-person-section">
                                    <h4>Identificação da Comanda</h4>
                                    {!pessoaAtiva ? (
                                        <div className="cart-person-input-group">
                                            <input 
                                                type="text" 
                                                className="cart-person-input" 
                                                placeholder="Para qual comanda?"
                                                value={novaPessoaNome}
                                                onChange={(e) => setNovaPessoaNome(e.target.value)}
                                            />
                                            <button 
                                                className="cart-person-btn"
                                                onClick={() => {
                                                    if(novaPessoaNome.trim()) setPessoaAtiva(novaPessoaNome.trim());
                                                }}
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="cart-person-active">
                                            <div className="cart-person-active-name">
                                                <Users size={16} /> Comanda: {pessoaAtiva}
                                            </div>
                                            <button className="cart-person-change-btn" onClick={() => setIsPeopleDrawerOpen(true)}>
                                                Trocar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {Object.keys(cart).length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, marginTop: '40px' }}>
                                    <ShoppingCart size={48} color="#888" style={{ marginBottom: '16px' }} />
                                    <p style={{ color: '#FFF', fontSize: '14px', textAlign: 'center' }}>Seu carrinho está vazio.</p>
                                </div>
                            ) : (
                                Object.entries(cart).map(([key, qty]) => {
                                    // key might be "productId" or "productId-variationName" 
                                    const hasVariation = key.includes('-');
                                    let pid = key;
                                    let varName = null;

                                    if (hasVariation) {
                                        const parts = key.split('-');
                                        pid = parts[0];
                                        varName = parts.slice(1).join('-'); // re-join in case variation name has hyphens
                                    }

                                    const pModel = products.find(p => p.id === pid);
                                    if (!pModel) return null;

                                    // Deduce price and image based on variation if applying
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

                                    return (
                                        <div key={key} className="cart-item">
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
                                                <button className="cart-trash-btn" onClick={() => {
                                                    setCart(prev => {
                                                        const newC = { ...prev };
                                                        delete newC[key];
                                                        return newC;
                                                    });
                                                }}>
                                                    <Trash2 size={16} />
                                                </button>
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
                                    );
                                })
                            )}
                        </div>

                        {/* UPSELL SECTION */}
                        {Object.keys(cart).length > 0 && products.length > 0 && (
                            <div className="cart-upsell-container">
                                <h4 className="upsell-title">Que tal adicionar?</h4>
                                <div className="upsell-scroll">
                                    {products
                                        .filter(p => !cart[p.id] && !Object.keys(cart).some(k => k.startsWith(p.id)) && p.id !== currentProduct?.id)
                                        .slice(0, 5)
                                        .map(p => (
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
                        )}

                        <div className="cart-footer">
                            <div className="cart-subtotal-row">
                                <span className="cart-subtotal-label">Subtotal</span>
                                <span className="cart-subtotal-value">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        Object.entries(cart).reduce((sum, [key, qty]) => {
                                            const hasVariation = key.includes('-');
                                            const pid = hasVariation ? key.split('-')[0] : key;
                                            const varName = hasVariation ? key.split('-').slice(1).join('-') : null;
                                            const pModel = products.find(p => p.id === pid);
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
                                       alert('Por favor, informe uma comanda para o seu pedido (campo no topo do carrinho).');
                                       return;
                                   }
                                   handleCheckout();
                                }}
                                disabled={Object.keys(cart).length === 0 || isCheckingOut}
                                style={{ opacity: (Object.keys(cart).length === 0 || isCheckingOut) ? 0.5 : 1 }}
                            >
                                {isCheckingOut ? (
                                    <><Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> ENVIANDO...</>
                                ) : (
                                    <>FINALIZAR PEDIDO <ChevronRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ORDER SUCCESS OVERLAY */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99999,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.92)',
                            backdropFilter: 'blur(12px)',
                            textAlign: 'center',
                            padding: '40px',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px',
                                boxShadow: '0 0 40px rgba(34,197,94,0.4)',
                            }}
                        >
                            <span style={{ fontSize: '36px' }}>✓</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                color: '#fff',
                                fontSize: '22px',
                                fontWeight: '800',
                                marginBottom: '8px',
                                fontFamily: 'Playfair Display, serif',
                            }}
                        >
                            Pedido Enviado!
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                color: '#aaa',
                                fontSize: '14px',
                                lineHeight: 1.5,
                            }}
                        >
                            Seu pedido foi recebido pela cozinha.
                        </motion.p>
                        <button
                            onClick={() => setOrderSuccess(false)}
                            style={{
                                marginTop: '30px',
                                padding: '12px 30px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#FFF',
                                borderRadius: '20px',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                        >
                            FECHAR
                        </button>
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
                                        autoFocus
                                    />
                                    <button 
                                        className="cart-person-btn"
                                        onClick={() => {
                                            if (novaPessoaNome.trim()) {
                                                setPessoaAtiva(novaPessoaNome.trim());
                                                setIsPeopleDrawerOpen(false);
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
        </div>
    );
};

export default App;
