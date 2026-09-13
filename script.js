const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let sections = document.querySelectorAll('section[id]');
let navLinks = document.querySelectorAll('.site-nav a');

// One underline slides between nav items: to whatever you hover, back to the current one on leave.
const nav = document.querySelector('.site-nav');
let moveIndicator = () => {};
if (nav) {
    const indicator = nav.appendChild(document.createElement('span'));
    indicator.className = 'nav-indicator';

    const slideTo = link => {
        if (!link) return;
        const style = getComputedStyle(link);
        const padLeft = parseFloat(style.paddingLeft);
        indicator.style.width = (link.offsetWidth - padLeft - parseFloat(style.paddingRight)) + 'px';
        indicator.style.transform = `translateX(${link.offsetLeft + padLeft}px)`;
    };

    moveIndicator = () => slideTo(nav.querySelector('a.active'));

    navLinks.forEach(link => link.addEventListener('mouseenter', () => slideTo(link)));
    nav.addEventListener('mouseleave', moveIndicator);
    window.addEventListener('resize', moveIndicator);

    moveIndicator();
    requestAnimationFrame(() => indicator.classList.add('is-ready')); // place it first, animate after
    // Widths shift when the webfont lands.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
}

// Highlight the nav item for the section in view (only sections that have a matching #anchor link).
window.addEventListener('scroll', () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let link = document.querySelector(`.site-nav a[href="#${sec.id}"]`);

        if (link && top >= offset && top < offset + height) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            moveIndicator();
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

// Ring icons for the portrait, keyed by each photo's data-icon (24x24 stroke paths).
const PORTRAIT_ICONS = {
    fish: '<path d="M7 12c2.5-4 5.5-6 8.5-6 3 0 5.5 2.5 6.5 6-1 3.5-3.5 6-6.5 6-3 0-6-2-8.5-6z"/><path d="M7 12 2 8v8z"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>',
    business: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M3 13h18"/>',
    robot: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 8V5"/><circle cx="12" cy="3.5" r="1.5"/><path d="M9.5 12.5v2M14.5 12.5v2M2.5 12v3M21.5 12v3"/>',
    tree: '<path d="M12 2 6 10h3l-4 6h14l-4-6h3z"/><path d="M12 16v6"/>',
    mountain: '<path d="M2 20 9 7l4.5 7.5L16 11l6 9z"/>',
    plane: '<path d="M12 2c1 0 1.5 1 1.5 2.5V9l8 5v2l-8-2.5V18l2.5 2v1.5L12 20.5l-4 1V20l2.5-2v-4.5l-8 2.5v-2l8-5V4.5C10.5 3 11 2 12 2z"/>',
    monkey: '<path d="M6 8.6A2.5 2.5 0 1 0 6 13.4M18 8.6A2.5 2.5 0 1 1 18 13.4"/><path d="M12 4c-4 0-6.5 3-6.5 7.5S8 20 12 20s6.5-4 6.5-8.5S16 4 12 4z"/><ellipse cx="12" cy="15.5" rx="3" ry="2"/><circle cx="9.8" cy="10.5" r=".6" fill="currentColor"/><circle cx="14.2" cy="10.5" r=".6" fill="currentColor"/>',
    pyramid: '<path d="M12 4 2 20h20z"/><path d="M12 4l3 16"/>',
};

// Rotating portrait: photos cross-fade and the icon ring turns so the current photo's icon sits at
// the bottom. Icons are clickable; auto-advance pauses while the portrait is hovered.
function initPortrait(root) {
    const photos = root.querySelectorAll('.portrait-photo');
    const ring = root.querySelector('.portrait-dots');
    const count = photos.length;
    if (count < 2) return;
    const step = 360 / count;
    let index = 0, turn = 0, timer = null, hovering = false;

    const dots = Array.from(photos, (photo, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'portrait-dot';
        dot.style.setProperty('--angle', `${i * step}deg`);
        dot.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${PORTRAIT_ICONS[photo.dataset.icon] || ''}</svg>`;
        dot.setAttribute('aria-label', `Show photo ${i + 1}`);
        dot.addEventListener('click', () => { show(i); restart(); });
        ring.appendChild(dot);
        return dot;
    });

    function show(i) {
        // Turn the short way round so the chosen icon lands at the bottom.
        let delta = (i - index + count) % count;
        if (delta > count / 2) delta -= count;
        turn -= delta * step;
        index = i;
        ring.style.setProperty('--turn', `${turn}deg`);
        photos.forEach((photo, j) => photo.classList.toggle('is-active', j === i));
        dots.forEach((dot, j) => dot.classList.toggle('active', j === i));
    }

    function restart() {
        clearInterval(timer);
        if (!reducedMotion && !hovering) timer = setInterval(() => show((index + 1) % count), 5000);
    }

    root.addEventListener('mouseenter', () => { hovering = true; clearInterval(timer); });
    root.addEventListener('mouseleave', () => { hovering = false; restart(); });
    show(0);
    restart();
}

document.addEventListener('DOMContentLoaded', () => {
    const dotField = document.querySelector('.dot-field');
    if (dotField) initDotField(dotField);

    const portrait = document.querySelector('.portrait');
    if (portrait) initPortrait(portrait);

    // Thumbnail videos only download and play while they're near the viewport.
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) target.play().catch(() => {});
            else target.pause();
        });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('video[data-autoplay]').forEach(video => videoObserver.observe(video));

    // Rotating role, typed out: each qualifier is sized to fill the fixed slot in front of "Engineer".
    const roleWord = document.querySelector('.role-word');
    if (roleWord) {
        const roles = [['Robotics', 40], ['Perception', 33], ['Mechatronics', 26], ['Product', 44]];
        let roleIndex = 0;
        const setRole = (text, size) => {
            roleWord.textContent = text;
            if (size) roleWord.style.setProperty('--role-size', size);
        };

        if (reducedMotion) {
            setInterval(() => {
                roleIndex = (roleIndex + 1) % roles.length;
                setRole(...roles[roleIndex]);
            }, 2800);
        } else {
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
            (async () => {
                for (;;) {
                    const [word] = roles[roleIndex];
                    await wait(1800); // hold the finished word
                    for (let i = word.length - 1; i >= 0; i--) { setRole(word.slice(0, i)); await wait(45); }
                    roleIndex = (roleIndex + 1) % roles.length;
                    const [next, size] = roles[roleIndex];
                    setRole('', size); // resize while empty, so the next word types in at its own size
                    await wait(300);
                    for (let i = 1; i <= next.length; i++) { setRole(next.slice(0, i)); await wait(90); }
                }
            })();
        }
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

        // A single slide needs no arrows, dots or auto-advance.
        if (slideCount < 2) {
            const nav = container.querySelector('.carousel-nav');
            if (nav) nav.hidden = true;
            if (dotsContainer) dotsContainer.hidden = true;
            return;
        }

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
