import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

const SmoothScroll = () => {
    useEffect(() => {
        if (window.lenis) {
            window.lenis.destroy();
            delete window.lenis;
        }

        const lenis = new Lenis({
            duration: 0.8,
            easing: (t) => 1 - Math.pow(1 - t, 4),
            smoothWheel: true,
            smoothTouch: false,
            wheelMultiplier: 0.9,
        });

        let frameId = 0;

        window.lenis = lenis;

        const raf = (time) => {
            lenis.raf(time);
            frameId = window.requestAnimationFrame(raf);
        };

        frameId = window.requestAnimationFrame(raf);

        return () => {
            window.cancelAnimationFrame(frameId);
            lenis.destroy();

            if (window.lenis === lenis) {
                delete window.lenis;
            }
        };
    }, []);

    return null;
};

export default SmoothScroll;
