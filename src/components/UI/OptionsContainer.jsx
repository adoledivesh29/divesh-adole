import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OptionCard from './OptionCard';
import image1 from '../../assets/images/gallary/city_palace.jpg'
import image2 from '../../assets/images/gallary/jagmandir.jpg'
import image3 from '../../assets/images/gallary/lake_palace.jpg'
import image4 from '../../assets/images/gallary/polo_forest.jpg'
import image5 from '../../assets/images/gallary/shivmandir.jpg'

gsap.registerPlugin(ScrollTrigger);

const options = [
    { main: 'City Palace', sub: 'Udaipur', background: image1 },
    { main: 'Jagmandir', sub: 'Island Palace', background: image2 },
    { main: 'Lake Palace', sub: 'Udaipur', background: image3 },
    { main: 'Polo Forest', sub: 'Gujarat', background: image4 },
    { main: 'Shivmandir', sub: 'Udaipur', background: image5 },
];

/* ── Modal ───────────────────────────────────────────────────────────── */
function ImageModal({ item, onClose }) {
    const overlayRef = useRef(null);
    const contentRef = useRef(null);

    // Animate in — expand FROM the card's screen rect TO the centered modal
    useEffect(() => {
        const overlay = overlayRef.current;
        const content = contentRef.current;
        const { originRect } = item;

        // Where the modal content ended up after render (centered by flexbox)
        const contentRect = content.getBoundingClientRect();

        // Delta: how far the modal center is from the card center
        const fromX = (originRect.left + originRect.width / 2) - (contentRect.left + contentRect.width / 2);
        const fromY = (originRect.top + originRect.height / 2) - (contentRect.top + contentRect.height / 2);

        // Scale factor: card size relative to modal size
        const fromScaleX = originRect.width / contentRect.width;
        const fromScaleY = originRect.height / contentRect.height;

        const tl = gsap.timeline();

        tl.fromTo(overlay,
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: 'power2.out' }
        ).fromTo(content,
            { x: fromX, y: fromY, scaleX: fromScaleX, scaleY: fromScaleY, borderRadius: '10px', opacity: 1 },
            { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '14px', duration: 0.55, ease: 'power3.out' },
            0   // start at the same time as overlay fade
        );

        // Close on Escape
        const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, []);

    // Animate out — shrink back TO the card's original position
    const handleClose = useCallback(() => {
        const overlay = overlayRef.current;
        const content = contentRef.current;
        const { originRect } = item;

        const contentRect = content.getBoundingClientRect();

        const toX = (originRect.left + originRect.width / 2) - (contentRect.left + contentRect.width / 2);
        const toY = (originRect.top + originRect.height / 2) - (contentRect.top + contentRect.height / 2);
        const toScaleX = originRect.width / contentRect.width;
        const toScaleY = originRect.height / contentRect.height;

        const tl = gsap.timeline({ onComplete: onClose });
        tl.to(content,
            { x: toX, y: toY, scaleX: toScaleX, scaleY: toScaleY, borderRadius: '10px', duration: 0.45, ease: 'power3.in' }
        ).to(overlay,
            { opacity: 0, duration: 0.25, ease: 'power2.in' },
            '<0.1'
        );
    }, [item, onClose]);

    return (
        <div
            ref={overlayRef}
            className="gallery-modal-overlay"
            onClick={handleClose}
        >
            <div
                ref={contentRef}
                className="gallery-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="gallery-modal-close" onClick={handleClose} aria-label="Close">
                    ✕
                </button>
                <img src={item.background} alt={item.main} className="gallery-modal-img" />
                <div className="gallery-modal-info">
                    <span className="gallery-modal-title">{item.main}</span>
                    {item.sub && <span className="gallery-modal-sub">{item.sub}</span>}
                </div>
            </div>
        </div>
    );
}

/* ── Container ───────────────────────────────────────────────────────── */
export default function OptionsContainer() {
    const gridRef = useRef(null);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const cards = grid.querySelectorAll('.option');
        const staggerSequence = [0, 0.2, 0.1, 0.3, 0.05, 0.25];

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: { trigger: grid, start: 'top 80%' },
            });

            gsap.set(cards, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%' });

            cards.forEach((card, index) => {
                tl.to(card, {
                    opacity: 1, scale: 1, duration: 1,
                    ease: 'power3.out',
                    delay: staggerSequence[index] ?? 0,
                }, 0);
            });

            cards.forEach((card) => {
                const onEnter = () => gsap.to(card, {
                    scale: 1.03,
                    boxShadow: '0 12px 40px rgba(201, 168, 76, 0.4)',
                    duration: 0.3, overwrite: 'auto',
                });
                const onLeave = () => gsap.to(card, {
                    scale: 1,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    duration: 0.3, overwrite: 'auto',
                });

                card.addEventListener('mouseenter', onEnter);
                card.addEventListener('mouseleave', onLeave);
                card._gsapEnter = onEnter;
                card._gsapLeave = onLeave;
            });
        }, gridRef);

        return () => {
            const cards = grid.querySelectorAll('.option');
            cards.forEach((card) => {
                card.removeEventListener('mouseenter', card._gsapEnter);
                card.removeEventListener('mouseleave', card._gsapLeave);
            });
            ctx.revert();
        };
    }, []);

    // Capture card's screen rect on click so modal can expand FROM that position
    const handleCardClick = useCallback((e, option) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setSelected({ ...option, originRect: rect });
    }, []);

    return (
        <>
            <div className="options" ref={gridRef}>
                {options.map((option, index) => (
                    <OptionCard
                        key={index}
                        {...option}
                        onClick={(e) => handleCardClick(e, option)}
                    />
                ))}
            </div>

            {selected && (
                <ImageModal
                    item={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}
