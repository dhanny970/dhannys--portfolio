(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- CAROUSEL ---------- */
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const viewport = carousel.querySelector('.carousel-viewport');
        const track = carousel.querySelector('.carousel-track');
        const originalSlides = [...track.children];
        const INTERVAL = 3000;
        const TRANSITION_MS = 900;
        let index = 1;
        let timer = null;
        let hoverOrFocus = false;
        let userStopped = reduceMotion;

        if (originalSlides.length > 1) {
            const firstClone = originalSlides[0].cloneNode(true);
            const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
            track.insertBefore(lastClone, track.firstChild);
            track.appendChild(firstClone);

            const slides = [...track.children];
            carousel.style.setProperty('--interval', INTERVAL + 'ms');

            const render = () => {
                track.style.transform = `translateX(${-index * 100}%)`;
                slides.forEach((s, i) => {
                    s.classList.toggle('is-active', i === index);
                    s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
                });
            };

            const stop = () => {
                clearTimeout(timer);
                carousel.classList.remove('is-playing');
            };

            const scheduleNext = () => {
                stop();
                if (userStopped || hoverOrFocus || document.hidden) return;
                carousel.classList.add('is-playing');
                timer = setTimeout(() => goTo(index + 1), INTERVAL);
            };

            const goTo = (nextIndex) => {
                index = nextIndex;
                track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 0.8, 0.2, 1)`;
                render();

                if (index === slides.length - 1) {
                    setTimeout(() => {
                        index = 1;
                        track.style.transition = 'none';
                        render();
                        requestAnimationFrame(() => {
                            track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 0.8, 0.2, 1)`;
                        });
                    }, TRANSITION_MS);
                }

                if (index === 0) {
                    setTimeout(() => {
                        index = slides.length - 2;
                        track.style.transition = 'none';
                        render();
                        requestAnimationFrame(() => {
                            track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 0.8, 0.2, 1)`;
                        });
                    }, TRANSITION_MS);
                }

                scheduleNext();
            };

            // keyboard: arrow keys when focus is inside the carousel
            carousel.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') { goTo(index - 1); }
                if (e.key === 'ArrowRight') { goTo(index + 1); }
            });

            // pause while hovering or keyboard-focused so nobody loses their place
            const pause = (v) => {
                hoverOrFocus = v;
                carousel.classList.toggle('is-paused', v);
                v ? stop() : scheduleNext();
            };
            carousel.addEventListener('mouseenter', () => pause(true));
            carousel.addEventListener('mouseleave', () => pause(false));
            carousel.addEventListener('focusin', () => pause(true));
            carousel.addEventListener('focusout', () => pause(false));
            document.addEventListener('visibilitychange', () => (document.hidden ? stop() : scheduleNext()));

            // swipe / drag
            let startX = 0, dx = 0, dragging = false;
            viewport.addEventListener('pointerdown', (e) => {
                dragging = true;
                startX = e.clientX;
                dx = 0;
                track.style.transition = 'none';
                viewport.classList.add('dragging');
                viewport.setPointerCapture(e.pointerId);
            });
            viewport.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                dx = e.clientX - startX;
                const pct = (dx / viewport.clientWidth) * 100;
                track.style.transform = `translateX(${-index * 100 + pct}%)`;
            });
            const endDrag = () => {
                if (!dragging) return;
                dragging = false;
                viewport.classList.remove('dragging');
                if (Math.abs(dx) > viewport.clientWidth * 0.15) {
                    goTo(index + (dx < 0 ? 1 : -1));
                } else {
                    track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 0.8, 0.2, 1)`;
                    render();
                    scheduleNext();
                }
            };
            viewport.addEventListener('pointerup', endDrag);
            viewport.addEventListener('pointercancel', endDrag);

            render();
            scheduleNext();
        }
    }

    /* ---------- SCROLL PROGRESS BAR ---------- */
    const bar = document.querySelector('.scroll-progress');
    if (bar && !reduceMotion) {
        let ticking = false;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    /* ---------- REVEAL ON SCROLL (skills, about, contact) ---------- */
    const targets = document.querySelectorAll('[data-reveal], .skills');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    en.target.classList.add('in-view');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.2 });
        targets.forEach((t) => io.observe(t));
    } else {
        targets.forEach((t) => t.classList.add('in-view'));
    }
})();
