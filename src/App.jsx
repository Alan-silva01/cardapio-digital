import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowLeft } from 'lucide-react';
import { products } from './data/products';

const App = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 = right, -1 = left
    const [selectedVariation, setSelectedVariation] = useState('nacional');

    const currentProduct = products[currentIndex];

    // Reset variation when product changes
    useEffect(() => {
        setSelectedVariation('nacional');
    }, [currentIndex]);

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
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="app-container" style={{
            backgroundImage: `url(${currentProduct.backgroundUrl || 'https://res.cloudinary.com/ddhlqymvf/image/upload/v1771525899/App_Bar_1080x1920_2_afm0f1.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.5s ease-in-out'
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
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentProduct.id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30, duration: 0.8 },
                            opacity: { duration: 0.6 }
                        }}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 900, marginBottom: '5px', zIndex: 5 }}>
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
                    <ChevronLeft size={32} color="#333" />
                </div>
                <div style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', zIndex: 20, cursor: 'pointer' }} onClick={() => paginate(1)}>
                    <ChevronRight size={32} color="#333" />
                </div>
            </div>

            {/* BOTTOM SHEET */}
            <div className="bottom-sheet">
                <div className="drag-handle" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentProduct.id + '-sheet'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '70px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <div className="rating" style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map((star) => {
                                    // Dynamic rating based on variation
                                    let effectiveRating = currentProduct.rating || 5;
                                    if (currentProduct.variations) {
                                        effectiveRating = selectedVariation === 'nacional' ? 4 : 5;
                                    }

                                    return (
                                        <span
                                            key={star}
                                            className={`star ${star > effectiveRating ? 'inactive' : ''}`}
                                            style={{ fontSize: '12px' }}
                                        >
                                            ★
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="category-label" style={{ marginBottom: 0 }}>{currentProduct.category}</div>
                        </div>

                        <div className="info-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                            <div className="product-name">{currentProduct.name}</div>
                            <div className="price-tag">
                                R$: {currentProduct.variations ? currentProduct.variations[selectedVariation] : currentProduct.price}
                            </div>
                        </div>

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

                        <p className="description" style={{ marginBottom: '15px' }}>
                            {currentProduct.description}
                        </p>

                        {/* VARIATION SELECTION (CHECKBOX STYLE) */}
                        {currentProduct.variations && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                {['nacional', 'importado'].map((variant) => (
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
