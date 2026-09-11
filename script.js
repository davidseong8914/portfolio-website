const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let sections = document.querySelectorAll('section[id]');
let navLinks = document.querySelectorAll('.site-nav a');

// Highlight the nav pill for the section in view (only sections that have a matching #anchor link).
window.addEventListener('scroll', () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let link = document.querySelector(`.site-nav a[href="#${sec.id}"]`);

        if (link && top >= offset && top < offset + height) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
}, { passive: true });

// Scroll stem: the fill tracks page progress and each leaf unfurls once progress reaches it.
const stem = document.querySelector('.stem');
if (stem) {
    const fill = stem.querySelector('.stem-fill');
    const leaves = Array.from(stem.querySelectorAll('.stem-leaf'), leaf => ({
        leaf,
        at: parseFloat(leaf.style.getPropertyValue('--at')),
    }));

    const updateStem = () => {
        const el = document.scrollingElement || document.documentElement;
        const progress = Math.min(1, el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
        fill.style.height = (progress * 100).toFixed(1) + '%';
        leaves.forEach(({ leaf, at }) => leaf.classList.toggle('is-open', progress >= at - 0.02));
    };

    window.addEventListener('scroll', updateStem, { passive: true });
    updateStem();
}

// Dot field behind the whole Home page: each dot wanders on its own slow loop, the field scrolls
// at a fifth of the page's speed, and dots near the cursor are pushed away and brighten.
function initDotField(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const TAU = Math.PI * 2;
    // Alpha is bucketed so a frame is a handful of fills rather than one per dot.
    const LEVELS = 6;
    const alphaFor = level => 0.14 + (level / (LEVELS - 1)) * 0.46;

    let W = 0, H = 0;
    let mx = -9999, my = -9999;
    const points = [];

    const makePoint = () => ({
        nx: Math.random(),
        ny: Math.random(),
        r: 0.5 + Math.random() * 1.5,
        level: Math.floor(Math.random() * LEVELS),
        amp: 4 + Math.random() * 10,
        sx: 0.15 + Math.random() * 0.35,
        sy: 0.15 + Math.random() * 0.35,
        px: Math.random() * TAU,
        py: Math.random() * TAU,
    });

    function resize() {
        const widthChanged = canvas.clientWidth !== W;
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Only re-count on width changes, so mobile toolbars sliding in and out don't pop dots.
        if (widthChanged) {
            const count = Math.min(1400, Math.round(W * H * 0.0006));
            while (points.length < count) points.push(makePoint());
            points.length = count;
        }
    }

    function drawFrame(now) {
        const t = now / 1000;
        const motion = reducedMotion ? 0 : 1;
        const shift = window.scrollY * 0.2 * motion;
        const paths = Array.from({ length: LEVELS }, () => new Path2D());
        const hot = [];

        ctx.clearRect(0, 0, W, H);
        for (const p of points) {
            let x = p.nx * W + Math.sin(t * p.sx + p.px) * p.amp * motion;
            let y = (((p.ny * H - shift) % H) + H) % H + Math.cos(t * p.sy + p.py) * p.amp * motion;
            const dx = x - mx, dy = y - my;
            const d2 = dx * dx + dy * dy;
            if (d2 < 110 * 110) {
                const d = Math.sqrt(d2) || 1;
                const push = (110 - d) * 0.75;
                x += (dx / d) * push;
                y += (dy / d) * push;
            }
            if (d2 < 190 * 190) {
                hot.push({ x, y, p });
            } else {
                paths[p.level].moveTo(x + p.r, y);
                paths[p.level].arc(x, y, p.r, 0, TAU);
            }
        }

        paths.forEach((path, level) => {
            ctx.fillStyle = `rgba(118,188,143,${alphaFor(level)})`;
            ctx.fill(path);
        });
        for (const { x, y, p } of hot) {
            ctx.beginPath();
            ctx.arc(x, y, p.r, 0, TAU);
            ctx.fillStyle = `rgba(150,240,180,${Math.min(1, alphaFor(p.level) + 0.32)})`;
            ctx.fill();
        }
    }

    resize();

    if (reducedMotion) {
        drawFrame(0);
        window.addEventListener('resize', () => { resize(); drawFrame(0); });
        return;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        mx = e.clientX;
        my = e.clientY;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { mx = my = -9999; });

    // requestAnimationFrame pauses on its own while the tab is hidden.
    const loop = now => { drawFrame(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', () => {
    const dotField = document.querySelector('.dot-field');
    if (dotField) initDotField(dotField);

    // Thumbnail videos only download and play while they're near the viewport.
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) target.play().catch(() => {});
            else target.pause();
        });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('video[data-autoplay]').forEach(video => videoObserver.observe(video));

    // Rotating role: each qualifier is sized to fill the fixed slot in front of "Engineer".
    const roleWord = document.querySelector('.role-word');
    if (roleWord) {
        const roles = [['Robotics', 40], ['Perception', 33], ['Mechatronics', 26], ['Product', 44]];
        let roleIndex = 0;
        setInterval(() => {
            roleIndex = (roleIndex + 1) % roles.length;
            const [word, size] = roles[roleIndex];
            roleWord.textContent = word;
            roleWord.style.setProperty('--role-size', size);
        }, 2800);
    }

    // Fun fact functionality
    const funFacts = [
        "I have traveled to 19 countries.",
        "Yo hablo español.",
        "I once did a 90 hour Greyhound trip from California to Virginia",
        "I'm a ceramics master.",
        "Favorite Book: Norwegian Wood by Haruki Murakami",
        "I saw the Great Pyramid of Giza",
        "I am a father of 3 beautiful Goldfish: Kush, Dominic, Nguyen",
        "Favorite Food: Hot Pot",
        "I have 2 brothers",
        "I love TRAVELING!",
        "Recipe for Happiness = Friends, Purpose, Helping Others",
        "Used to be in a Band! UNIKISTS!",
        "I took German 101, Ich heiße David",
        "I can gleek (spit like a snake)",
        "I can split an apple in half with my bare hands",
        "More to come...",
    ];

    const funFactBtn = document.getElementById("fun-fact-btn");
    const funFactContainer = document.getElementById("fun-fact-container");

    if (funFactBtn && funFactContainer) {
        funFactBtn.addEventListener("click", function (event) {
            event.preventDefault();
            const randomIndex = Math.floor(Math.random() * funFacts.length);
            funFactContainer.innerText = funFacts[randomIndex];
        });
    }

    // Intersection Observer for robot images
    const robotImages = document.querySelectorAll('.current-robot-image, .current-robot-image-op');


    robotImages.forEach(image => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Stop observing once the animation is applied
                }
            });
        }, observerOptions);

        observer.observe(image);
    });

    // Function to initialize carousel
    function initializeCarousel(container) {
        const track = container.querySelector('.carousel-track');
        const slideCount = track.children.length;
        const dotsContainer = container.querySelector('.carousel-dots');
        let currentIndex = 0;
        let autoplayInterval;

        const dots = Array.from(track.children, (_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', `Show project ${index + 1}`);
            dot.addEventListener('click', () => { stopAutoplay(); goToSlide(index); });
            dotsContainer.appendChild(dot);
            return dot;
        });

        function goToSlide(index) {
            currentIndex = (index + slideCount) % slideCount;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
        }

        // Any manual navigation stops auto-advance for good.
        function stopAutoplay() {
            clearInterval(autoplayInterval);
        }

        container.querySelector('[data-carousel-prev]').addEventListener('click', () => { stopAutoplay(); goToSlide(currentIndex - 1); });
        container.querySelector('[data-carousel-next]').addEventListener('click', () => { stopAutoplay(); goToSlide(currentIndex + 1); });

        goToSlide(0);
        if (!reducedMotion) {
            autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 7000);
        }
    }

    // Initialize all carousels
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => initializeCarousel(carousel));

    // Projects index: category filter chips show/hide whole groups.
    const chips = document.querySelectorAll('.chip');
    const groups = document.querySelectorAll('.group');
    chips.forEach(chip => chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        chips.forEach(c => {
            c.classList.toggle('active', c === chip);
            c.setAttribute('aria-pressed', c === chip);
        });
        groups.forEach(group => {
            group.hidden = filter !== 'All' && group.dataset.cat !== filter;
        });
    }));
});
