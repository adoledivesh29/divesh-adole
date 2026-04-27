import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const words = [
  'Problem Solver',
  'Creative Thinker',
  'Team Collaborator',
  'Fast Learner',
  'Detail-Oriented',
  'Curious Learner',
  'Open Source',
];

// const LOOP_DURATION = 10;
// const CHAR_DURATION = 3;
// const SHATTER_X_RANGE = 400;
// const SHATTER_Y_RANGE = 800;
// const SHATTER_ROTATION_RANGE = 50;
// const REVEAL_TRIGGER_RATIO = 1;


const isMobile = window.innerWidth < 420;

const LOOP_DURATION = isMobile ? 14 : 10;
const CHAR_DURATION = isMobile ? 2 : 3;
const SHATTER_X_RANGE = isMobile ? 50 : 400;
const SHATTER_Y_RANGE = isMobile ? 100 : 800;
const SHATTER_ROTATION_RANGE = isMobile ? 5 : 50;
const REVEAL_TRIGGER_RATIO = isMobile ? 1 : 1;

const SkillMarquee = () => {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return undefined;

    const ctx = gsap.context(() => {
      const splitItem = (item) => {
        const text = item.dataset.text ?? item.textContent ?? '';
        item.dataset.text = text;
        item.textContent = '';

        text.split('').forEach((char) => {
          const span = document.createElement('span');
          span.className = 'sm-char';
          span.textContent = char === ' ' ? '\u00A0' : char;
          item.appendChild(span);
        });
      };

      track.querySelectorAll('.sm-item').forEach(splitItem);

      let introTween;
      let marqueeTween;
      let charTweens = [];

      const buildAnimation = () => {
        introTween?.kill();
        marqueeTween?.kill();
        charTweens.forEach((tween) => tween.kill());
        charTweens = [];

        gsap.set(track, { x: wrapper.offsetWidth });
        gsap.set(track.querySelectorAll('.sm-char'), {
          clearProps: 'x,y,rotation,opacity',
        });

        const primaryGroup = track.querySelector('.sm-group');
        if (!primaryGroup) return;

        const groupWidth = primaryGroup.offsetWidth;
        const wrapperWidth = wrapper.offsetWidth;
        if (!groupWidth || !wrapperWidth) return;

        const pixelsPerSecond = groupWidth / LOOP_DURATION;
        const startX = wrapperWidth;
        // Trigger each character reveal exactly when it reaches the right edge.
        const triggerX = wrapperWidth * REVEAL_TRIGGER_RATIO;

        const introDuration = wrapperWidth / pixelsPerSecond;

        introTween = gsap.to(track, {
          x: 0,
          duration: introDuration,
          ease: 'none',
          onComplete: () => {
            marqueeTween = gsap.to(track, {
              x: -groupWidth,
              duration: LOOP_DURATION,
              ease: 'none',
              repeat: -1,
            });
          },
        });

        track.querySelectorAll('.sm-char').forEach((char) => {
          const charLeft = char.offsetLeft;
          const distanceToTrigger = startX + charLeft - triggerX;
          const delay = gsap.utils.wrap(
            0,
            LOOP_DURATION,
            distanceToTrigger / pixelsPerSecond
          );

          const tween = gsap.fromTo(
            char,
            {
              xPercent: gsap.utils.random(-SHATTER_X_RANGE, SHATTER_X_RANGE),
              yPercent: gsap.utils.random(-SHATTER_Y_RANGE, SHATTER_Y_RANGE),
              rotation: gsap.utils.random(-SHATTER_ROTATION_RANGE, SHATTER_ROTATION_RANGE),
              opacity: 0,
            },
            {
              xPercent: 0,
              yPercent: 0,
              rotation: 0,
              opacity: 1,
              duration: CHAR_DURATION,
              ease: 'back.out(1.2)',
              repeat: -1,
              repeatDelay: LOOP_DURATION - CHAR_DURATION,
              delay,
            }
          );

          charTweens.push(tween);
        });
      };

      buildAnimation();

      const resizeObserver = new ResizeObserver(buildAnimation);
      resizeObserver.observe(wrapper);

      return () => {
        resizeObserver.disconnect();
        introTween?.kill();
        marqueeTween?.kill();
        charTweens.forEach((tween) => tween.kill());
      };
    }, wrapper);

    return () => ctx.revert();
  }, []);

  const renderGroup = (keyPrefix, hidden = false) => (
    <div className="sm-group" aria-hidden={hidden}>
      {words.map((word, index) => (
        <span key={`${keyPrefix}-${index}`} className="sm-item">{word}</span>
      ))}
    </div>
  );

  return (
    <section className="marquees-wrapper" ref={wrapperRef}>
      <div className="sm-strip">
        <div ref={trackRef} className="sm-track">
          {renderGroup('primary')}
          {renderGroup('duplicate', true)}
        </div>
      </div>
    </section>
  );
};

export default SkillMarquee;
