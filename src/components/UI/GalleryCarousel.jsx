import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import image1 from '../../assets/images/gallary/city_palace.jpg';
import image2 from '../../assets/images/gallary/jagmandir.jpg';
import image3 from '../../assets/images/gallary/lake_palace.jpg';
import image4 from '../../assets/images/gallary/polo_forest.jpg';
import image5 from '../../assets/images/gallary/shivmandir.jpg';

const slides = [
    { main: 'City Palace',  sub: 'Udaipur',      background: image1 },
    { main: 'Jagmandir',    sub: 'Island Palace', background: image2 },
    { main: 'Lake Palace',  sub: 'Udaipur',       background: image3 },
    { main: 'Polo Forest',  sub: 'Gujarat',       background: image4 },
    { main: 'Shivmandir',   sub: 'Udaipur',       background: image5 },
];

const ANIM_DURATION  = 0.5;   // slide transition duration (s)
const AUTO_INTERVAL  = 3500;  // ms between auto-advances

/* ── Modal ────────────────────────────────────────────────────────────── */
function CarouselModal({ item, onClose }) {
    const overlayRef = useRef(null);

    const handleClose = useCallback(() => {
        gsap.to(overlayRef.current, {
            opacity: 0, y: 40, duration: 0.3, ease: 'power3.in',
            onComplete: onClose,
        });
    }, [onClose]);

    useEffect(() => {
        gsap.fromTo(overlayRef.current,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );
        document.body.style.overflow = 'hidden';

        const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [handleClose]);

    return (
        <div ref={overlayRef} className="gc-modal-overlay" onClick={handleClose}>
            <div className="gc-modal-sheet" onClick={(e) => e.stopPropagation()}>
                <button className="gc-modal-close" onClick={handleClose} aria-label="Close">✕</button>
                <img src={item.background} alt={item.main} className="gc-modal-img" />
                <div className="gc-modal-info">
                    <span className="gc-modal-title">{item.main}</span>
                    {item.sub && <span className="gc-modal-sub">{item.sub}</span>}
                </div>
            </div>
        </div>
    );
}

/* ── Carousel ─────────────────────────────────────────────────────────── */
export default function GalleryCarousel() {
    const [current, setCurrent]   = useState(0);
    const [selected, setSelected] = useState(null);

    const trackRef     = useRef(null);
    const autoRef      = useRef(null);
    const isAnimating  = useRef(false);
    const currentRef   = useRef(0);    // imperative mirror — safe inside intervals/callbacks
    const safetyTimer  = useRef(null); // fallback unlock in case onComplete is skipped
    const touchStart   = useRef(null);

    /* ── Core: single animation function ─────────────────────────────── */
    const animateTo = useCallback((nextIdx, dir = 1) => {
        if (isAnimating.current) return false;

        const track = trackRef.current;
        if (!track) return false;

        const slideEls  = Array.from(track.querySelectorAll('.gc-slide'));
        const fromEl    = slideEls[currentRef.current];
        const toEl      = slideEls[nextIdx];

        if (!fromEl || !toEl || fromEl === toEl) return false;

        // Lock
        isAnimating.current = true;

        // Kill any in-flight tweens so they don't conflict
        gsap.killTweensOf([fromEl, toEl]);

        // Safety unlock — guarantees lock is always released even if onComplete skips
        clearTimeout(safetyTimer.current);
        safetyTimer.current = setTimeout(() => {
            isAnimating.current = false;
        }, (ANIM_DURATION * 1000) + 200);

        // Position incoming off-screen
        gsap.set(toEl, { x: dir > 0 ? '100%' : '-100%', opacity: 1, zIndex: 2 });
        gsap.set(fromEl, { zIndex: 1 });

        gsap.timeline({
            defaults: { duration: ANIM_DURATION, ease: 'power3.inOut' },
            onComplete: () => {
                clearTimeout(safetyTimer.current);
                isAnimating.current = false;
                // Clean up z-index on the outgoing slide
                gsap.set(fromEl, { zIndex: 0 });
            },
        })
        .to(fromEl, { x: dir > 0 ? '-100%' : '100%', opacity: 0 }, 0)
        .to(toEl,   { x: '0%', opacity: 1 }, 0);

        // Update imperative ref first, then React state
        currentRef.current = nextIdx;
        setCurrent(nextIdx);
        return true;
    }, []);

    /* ── Auto-advance ─────────────────────────────────────────────────── */
    const startAuto = useCallback(() => {
        clearInterval(autoRef.current);
        autoRef.current = setInterval(() => {
            const next = (currentRef.current + 1) % slides.length;
            animateTo(next, 1);
        }, AUTO_INTERVAL);
    }, [animateTo]);

    /* ── Manual nav (dots / swipe) ───────────────────────────────────── */
    const manualNav = useCallback((dir) => {
        const next = (currentRef.current + dir + slides.length) % slides.length;
        if (animateTo(next, Math.sign(dir) || 1)) {
            startAuto(); // reset the timer on user interaction
        }
    }, [animateTo, startAuto]);

    /* ── Init: set all slides to their starting positions ────────────── */
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        const slideEls = track.querySelectorAll('.gc-slide');
        slideEls.forEach((s, i) => {
            gsap.set(s, {
                x:       i === 0 ? '0%'  : '100%',
                opacity: i === 0 ? 1     : 0,
                zIndex:  i === 0 ? 1     : 0,
            });
        });
    }, []);

    /* ── Start auto-advance on mount ─────────────────────────────────── */
    useEffect(() => {
        startAuto();
        return () => {
            clearInterval(autoRef.current);
            clearTimeout(safetyTimer.current);
        };
    }, [startAuto]);

    /* ── Touch swipe ─────────────────────────────────────────────────── */
    const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
    const onTouchEnd   = (e) => {
        if (touchStart.current === null) return;
        const delta = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 40) manualNav(delta > 0 ? 1 : -1);
        touchStart.current = null;
    };

    /* ── Dot click: go directly to a specific slide ──────────────────── */
    const goToSlide = useCallback((i) => {
        const dir = i > currentRef.current ? 1 : -1;
        if (animateTo(i, dir)) startAuto();
    }, [animateTo, startAuto]);

    /* ── Render ──────────────────────────────────────────────────────── */
    return (
        <div className="gc-wrapper">
            {/* Track */}
            <div
                className="gc-track"
                ref={trackRef}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className={`gc-slide${i === current ? ' gc-slide--active' : ''}`}
                        onClick={() => setSelected(slide)}
                    >
                        <img src={slide.background} alt={slide.main} className="gc-slide-img" />
                        <div className="gc-slide-gradient" />
                        <div className="gc-slide-label">
                            <span className="gc-slide-main">{slide.main}</span>
                            {slide.sub && <span className="gc-slide-sub">{slide.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dot indicators */}
            <div className="gc-dots">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        className={`gc-dot${i === current ? ' gc-dot--active' : ''}`}
                        onClick={() => goToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Progress bar — key on current so CSS animation restarts each slide */}
            <div className="gc-progress-bar" key={current}>
                <div className="gc-progress-fill" />
            </div>

            {/* Modal */}
            {selected && (
                <CarouselModal item={selected} onClose={() => setSelected(null)} />
            )}
        </div>
    );
}
