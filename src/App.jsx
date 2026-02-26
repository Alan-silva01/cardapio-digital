import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

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
    const [selectedVariation, setSelectedVariation] = useState(null);

    const currentProduct = products.length > 0 ? products[currentIndex] : null;

    // Fetch Products and their Variants from Supabase
    useEffect(() => {
        const fetchMenu = async () => {
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
                        imageUrl: p.imagem_url,
                        price: defaultPrice,
                        variations: varsDict,
                        flagUrl: p.pais_origem ? countryFlags[p.pais_origem] : null,
                        paisOrigem: p.pais_origem || null,
                    };
                });

                // Preload all images (backgrounds and flags) in the background
                const imagesToPreload = new Set();
                enrichedProducts.forEach(p => {
                    if (p.imageUrl) imagesToPreload.add(p.imageUrl);
                    if (p.flagUrl) imagesToPreload.add(p.flagUrl);
                });

                imagesToPreload.forEach(url => {
                    const img = new Image();
                    img.src = url;
                });

                setProducts(enrichedProducts);
            } catch (error) {
                console.error('Error fetching menu from Supabase:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);
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
    }, [currentIndex, currentProduct]);

    const paginate = (newDirection) => {
        setDirection(newDirection);
        // Circular navigation
        let nextIndex = currentIndex + newDirection;
        if (nextIndex < 0) nextIndex = products.length - 1;
        if (nextIndex >= products.length) nextIndex = 0;
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
        enter: ({ direction, isFood }) => ({
            x: direction > 0 ? (isFood ? 150 : 50) : (isFood ? -150 : -50),
            y: isFood ? 50 : 0,
            rotate: isFood ? (direction > 0 ? 15 : -15) : 0,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
        },
        exit: ({ direction, isFood }) => ({
            zIndex: 0,
            x: direction < 0 ? (isFood ? 150 : 50) : (isFood ? -150 : -50),
            y: isFood ? 50 : 0,
            rotate: isFood ? (direction < 0 ? 15 : -15) : 0,
            opacity: 0,
        }),
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

    return (
        <div className="app-container" style={{
            background: `url('https://res.cloudinary.com/ddhlqymvf/image/upload/v1771525899/App_Bar_1080x1920_2_afm0f1.png') center/cover no-repeat`,
            transition: 'background 0.5s ease-in-out'
        }}>
            {/* Background Tint Overlay */}
            <div className="tint-layer" />

            {/* FIXED TOP NAV */}
            <div className="top-nav">
                <ArrowLeft className="icon" />
                <div className="page-title">{currentProduct.category}</div>
                <ShoppingCart className="icon" />
            </div>

            {/* ANIMATED HERO SECTION */}
            <div className="hero" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingTop: '10px' }}>
                <AnimatePresence initial={false} custom={{ direction, isFood: currentProduct?.category === 'Petiscos' }}>
                    <motion.div
                        key={currentProduct.id}
                        custom={{ direction, isFood: currentProduct?.category === 'Petiscos' }}
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

                        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 900, marginBottom: '5px', zIndex: 5, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {currentProduct.name}
                        </h1>

                        <div style={{ position: 'relative', width: '100%', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '5px' }}>
                            {/* Back Glow */}
                            <div style={{
                                position: 'absolute', width: '200px', height: '200px',
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                                borderRadius: '50%', zIndex: 0
                            }} />

                            <img
                                src={currentProduct.imageUrl}
                                alt={currentProduct.name}
                                style={{ maxHeight: '90%', width: 'auto', objectFit: 'contain', zIndex: 2 }}
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
            <div className="bottom-sheet" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="drag-handle" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentProduct.id + '-sheet'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '70px', height: '100%' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="rating" style={{ display: 'flex', gap: '2px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        // Dynamic rating based on variation
                                        let effectiveRating = currentProduct.rating || 5;
                                        if (currentProduct.variations) {
                                            if (selectedVariation === 'nacional') effectiveRating = 4;
                                            else if (selectedVariation === 'importado') effectiveRating = 5;
                                            else if (selectedVariation === 'com álcool') effectiveRating = 5;
                                            else if (selectedVariation === 'sem álcool') effectiveRating = 4.5;
                                        }

                                        const isFull = star <= effectiveRating;
                                        const isHalf = !isFull && star - 0.5 <= effectiveRating;

                                        return (
                                            <span
                                                key={star}
                                                className={`star ${!isFull && !isHalf ? 'inactive' : ''}`}
                                                style={{
                                                    fontSize: '12px',
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
                                </div>
                                <div className="category-label" style={{ marginBottom: 0 }}>{currentProduct.category}</div>
                            </div>
                            <div className="price-tag" style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                                {formattedPrice}
                            </div>
                        </div>

                        <div className="info-header" style={{ marginBottom: '10px', textAlign: 'center' }}>
                            <div className="product-name" style={{ fontSize: '26px' }}>{currentProduct.name}</div>
                        </div>

                        {currentProduct.size && (
                            <div className="specs-row" style={{ marginBottom: '10px' }}>
                                <div className="ingredients-line" style={{
                                    color: '#eee',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    width: '100%',
                                    textAlign: 'center'
                                }}>
                                    {currentProduct.size}
                                </div>
                            </div>
                        )}

                        <p className="description" style={{ marginBottom: '15px' }}>
                            {currentProduct.description}
                        </p>

                        {/* VARIATION SELECTION (CHECKBOX STYLE) */}
                        {currentProduct.variations && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                {Object.keys(currentProduct.variations).map((variant) => (
                                    <button
                                        key={variant}
                                        onClick={() => setSelectedVariation(variant)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '12px',
                                            border: `1.5px solid ${selectedVariation === variant ? '#D4AF37' : '#333'}`,
                                            background: selectedVariation === variant ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                                            color: selectedVariation === variant ? '#D4AF37' : '#888',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <div style={{
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '4px',
                                            border: `1px solid ${selectedVariation === variant ? '#D4AF37' : '#444'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: selectedVariation === variant ? '#D4AF37' : 'transparent'
                                        }}>
                                            {selectedVariation === variant && (
                                                <div style={{ width: '6px', height: '6px', backgroundColor: '#000', borderRadius: '1px' }} />
                                            )}
                                        </div>
                                        {variant}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
                {/* ADD BUTTON - PINNED TO BOTTOM */}
                <button className="add-btn" style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', width: 'auto' }}>Adicionar</button>
            </div>
        </div>
    );
};

export default App;
