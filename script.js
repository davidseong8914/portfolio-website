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

// Salmon layer: one bioluminescent chum salmon swims behind every page's content, chasing the cursor
// most of the time, and now and then a small school crosses. The artwork was traced from a photo, so
// it's kept verbatim. It's defined once in <defs> and instanced with <use>, so the mouth morph (which
// edits the defs) moves every fish at once. The artwork faces -x; fish-local body axis is y≈48.
const SAL_DEFS = `
<linearGradient id="sal-body-g" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#17493c"/><stop offset="0.34" stop-color="#0d2620"/><stop offset="0.7" stop-color="#123c31"/><stop offset="1" stop-color="#20604d"/>
</linearGradient>
<linearGradient id="sal-fin-g" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#7ef2c0" stop-opacity="0.05"/><stop offset="1" stop-color="#7ef2c0" stop-opacity="0.30"/>
</linearGradient>
<filter id="sal-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="sal-warp" x="-50%" y="-50%" width="200%" height="200%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" result="warped"/>
  <feGaussianBlur in="warped" stdDeviation="0.6"/>
</filter>
<g id="sal-tail">
  <path d="M202.0,41.8 C201.8,38.8 199.2,35.3 200.4,33.9 C201.7,32.5 206.5,33.9 209.5,33.2 C212.5,32.5 214.5,31.9 218.6,29.9 C222.7,27.9 228.7,22.9 233.8,21.0 C239.0,19.1 247.0,18.0 249.5,18.8 C252.0,19.6 249.6,22.4 248.6,25.9 C247.6,29.4 244.0,36.4 243.3,39.8 C242.6,43.2 243.3,42.7 244.2,46.2 C245.0,49.7 247.5,57.1 248.4,60.8 C249.3,64.5 251.3,67.2 249.5,68.3 C247.7,69.4 241.4,68.7 237.3,67.5 C233.2,66.3 229.6,63.2 225.1,60.9 C220.6,58.6 214.5,55.3 210.6,53.8 C206.7,52.3 203.2,54.0 201.8,52.0 C200.4,50.0 202.2,44.8 202.0,41.8 Z" fill="url(#sal-fin-g)" stroke="#7ef2c0" stroke-width="1.1"></path>
  <path d="M206,36 L243,23 M207,41 L240,36 M207,48 L241,50 M208,53 L244,64" stroke="rgba(126,242,192,0.34)" stroke-width="0.7" fill="none"></path>
  <g fill="#bdffe2" opacity="0.85">
    <circle cx="221" cy="31" r="1"></circle>
    <circle cx="234" cy="27" r="0.85"></circle>
    <circle cx="224" cy="55" r="0.9"></circle>
    <circle cx="238" cy="60" r="0.8"></circle>
  </g>
</g>
<g id="sal-body">
  <g style="transform-origin:130px 24px; animation:sal-flex 4.7s ease-in-out infinite">
    <path d="M130.6,21.3 C124.7,20.5 114.6,21.1 113.1,20.4 C111.5,19.7 119.4,17.9 121.3,17.1 C123.2,16.3 122.7,16.5 124.4,15.5 C126.1,14.5 128.5,12.7 131.3,11.3 C134.1,9.9 139.3,7.0 141.2,7.0 C143.1,7.0 141.9,9.1 142.5,11.0 C143.1,12.9 144.0,15.9 145.0,18.3 C146.0,20.7 150.9,24.8 148.5,25.3 C146.1,25.8 136.5,22.1 130.6,21.3 Z" fill="url(#sal-fin-g)" stroke="#7ef2c0" stroke-width="0.9"></path>
  </g>
  <g fill="#bdffe2" opacity="0.85">
    <circle cx="130" cy="15" r="0.85"></circle>
    <circle cx="139" cy="11" r="0.8"></circle>
    <circle cx="137" cy="20" r="0.8"></circle>
  </g>
  <path d="M186.1,29.0 C186.2,28.2 191.5,26.1 193.2,25.3 C194.8,24.5 194.6,24.1 196.0,24.2 C197.4,24.3 200.6,24.9 201.8,25.9 C203.0,26.9 203.3,29.1 203.1,30.2 C202.9,31.3 202.1,32.8 200.4,32.8 C198.7,32.8 195.1,30.7 192.7,30.1 C190.3,29.5 186.0,29.8 186.1,29.0 Z" fill="url(#sal-fin-g)" stroke="#7ef2c0" stroke-width="0.8"></path>
  <g style="transform-origin:137px 71px; animation:sal-pelvic 2.9s ease-in-out infinite">
    <path d="M134.4,72.2 C134.1,72.8 136.3,74.1 137.9,75.3 C139.6,76.5 142.1,78.6 144.3,79.6 C146.5,80.6 150.1,82.0 151.2,81.4 C152.3,80.8 150.7,77.8 150.7,76.1 C150.7,74.4 152.2,72.3 151.4,71.5 C150.6,70.7 148.1,71.5 146.1,71.5 C144.1,71.5 141.6,71.6 139.7,71.7 C137.8,71.8 134.7,71.6 134.4,72.2 Z" fill="url(#sal-fin-g)" stroke="#7ef2c0" stroke-width="0.8"></path>
  </g>
  <g style="transform-origin:173px 70px; animation:sal-flex 3.3s ease-in-out infinite">
    <path d="M175.5,72.0 C177.4,73.8 180.9,77.1 182.8,77.6 C184.7,78.1 185.0,76.6 186.7,74.8 C188.4,73.0 191.3,68.8 193.2,66.6 C195.1,64.4 196.6,63.6 198.4,61.5 C200.2,59.4 205.2,55.2 204.2,54.0 C203.2,52.8 196.3,53.5 192.5,54.5 C188.7,55.5 184.9,58.0 181.4,60.0 C177.9,62.0 172.3,64.6 171.3,66.6 C170.3,68.6 173.6,70.2 175.5,72.0 Z" fill="url(#sal-fin-g)" stroke="#7ef2c0" stroke-width="0.8"></path>
  </g>
  <path data-morph="body" d="M10.4,48.3 C7.6,47.4 5.5,47.3 5.5,46.3 C5.5,45.3 7.2,43.5 10.1,42.3 C13.0,41.1 18.8,41.0 23.0,39.0 C27.2,37.0 29.9,32.5 35.1,30.6 C40.3,28.8 46.1,29.3 54.1,27.9 C62.1,26.5 75.4,23.4 82.9,22.2 C90.4,21.0 93.8,21.0 99.2,20.6 C104.7,20.2 107.5,19.0 115.6,19.7 C123.7,20.4 138.4,23.1 147.6,24.6 C156.8,26.1 164.4,28.1 170.6,28.8 C176.8,29.5 180.1,28.1 185.0,29.0 C189.9,29.9 197.2,30.3 199.8,34.1 C202.5,38.0 202.5,48.6 200.9,52.1 C199.3,55.6 196.6,52.4 190.5,55.4 C184.4,58.4 171.5,67.3 164.2,69.9 C156.9,72.6 154.8,70.3 146.5,71.3 C138.2,72.3 124.7,75.0 114.2,76.0 C103.7,77.0 93.6,78.1 83.5,77.0 C73.4,75.9 61.2,71.4 53.5,69.4 C45.8,67.4 43.9,66.7 37.1,64.8 C30.4,62.9 18.3,60.1 13.0,58.0 C7.7,55.9 6.5,53.9 5.5,52.2 C4.5,50.5 5.9,48.3 6.8,48.0 C7.7,47.7 7.7,49.2 10.8,50.2 C13.9,51.2 21.9,53.4 25.2,54.0 C28.5,54.6 30.9,54.2 30.5,53.8 C30.1,53.4 25.9,52.5 22.5,51.6 C19.1,50.7 13.2,49.2 10.4,48.3 Z" fill="url(#sal-body-g)" stroke="#7ef2c0" stroke-width="1.5"></path>
  <g style="transform-origin:53px 67px; animation:sal-pec 2.3s ease-in-out infinite">
    <path d="M53.2,72.6 C53.6,75.0 55.1,78.3 56.5,79.7 C57.9,81.1 59.7,81.6 61.6,81.2 C63.5,80.8 66.6,79.5 68.0,77.6 C69.4,75.7 70.4,71.6 70.0,69.9 C69.6,68.2 67.2,67.9 65.4,67.5 C63.6,67.1 60.8,67.9 59.0,67.5 C57.2,67.1 55.4,64.5 54.4,65.3 C53.4,66.1 52.9,70.2 53.2,72.6 Z" fill="url(#sal-fin-g)" stroke="#7ef2c0" stroke-width="0.9"></path>
    <path d="M57,69 C60,74 63,77 67,78" fill="none" stroke="rgba(126,242,192,0.3)" stroke-width="0.6"></path>
  </g>
  <g style="transform-origin:55px 35px; animation:sal-gill 3.4s ease-in-out infinite">
    <path data-morph="gill" d="M54.8,34.8 C55.6,35.4 58.3,37.3 59.4,38.7 C60.5,40.1 61.1,41.3 61.4,43.2 C61.7,45.1 61.5,48.0 61.2,50.0 C60.9,52.0 61.0,52.7 59.6,55.0 C58.2,57.3 53.9,62.2 52.8,63.6" fill="none" stroke="#7ef2c0" stroke-width="1.3"></path>
  </g>
  <path d="M62,48 C104,54 156,52 198,44" fill="none" stroke="rgba(126,242,192,0.36)" stroke-width="0.9"></path>
  <g fill="#bdffe2">
    <circle cx="40" cy="34.9" r="1.25"></circle>
    <circle cx="53" cy="33.1" r="1.20"></circle>
    <circle cx="59.0" cy="40.1" r="0.93"></circle>
    <circle cx="66" cy="30.5" r="1.15"></circle>
    <circle cx="72.0" cy="37.5" r="0.89"></circle>
    <circle cx="79" cy="28.0" r="1.10"></circle>
    <circle cx="85.0" cy="35.0" r="0.85"></circle>
    <circle cx="92" cy="26.3" r="1.05"></circle>
    <circle cx="98.0" cy="33.3" r="0.81"></circle>
    <circle cx="105" cy="25.3" r="1.00"></circle>
    <circle cx="111.0" cy="32.3" r="0.77"></circle>
    <circle cx="118" cy="25.1" r="0.95"></circle>
    <circle cx="124.0" cy="32.1" r="0.73"></circle>
    <circle cx="131" cy="27.1" r="0.90"></circle>
    <circle cx="137.0" cy="34.1" r="0.69"></circle>
    <circle cx="144" cy="29.0" r="0.85"></circle>
    <circle cx="150.0" cy="36.0" r="0.65"></circle>
    <circle cx="157" cy="31.3" r="0.80"></circle>
    <circle cx="163.0" cy="38.3" r="0.61"></circle>
    <circle cx="170" cy="33.7" r="0.75"></circle>
    <circle cx="176.0" cy="40.7" r="0.57"></circle>
    <circle cx="183" cy="34.0" r="0.70"></circle>
    <circle cx="189.0" cy="41.0" r="0.53"></circle>
    <circle cx="196" cy="34.0" r="0.65"></circle>
  </g>
  <circle data-morph="eye" cx="35.56" cy="42.06" r="3.2" fill="#0b211c" stroke="#7ef2c0" stroke-width="1"></circle>
  <circle data-morph="pupil" cx="35.56" cy="42.06" r="1.3" fill="#d9fff0"></circle>
</g>`;

// The two traced mouth outlines. Only the body, gill line and eye differ, with matching point counts.
const SAL_MORPH = {
    body: { closed: [[10.4,48.3],[5.5,46.3],[10.1,42.3],[23,39],[35.1,30.6],[54.1,27.9],[82.9,22.2],[99.2,20.6],[115.6,19.7],[147.6,24.6],[170.6,28.8],[185,29],[199.8,34.1],[200.9,52.1],[190.5,55.4],[164.2,69.9],[146.5,71.3],[114.2,76],[83.5,77],[53.5,69.4],[37.1,64.8],[13,58],[5.5,52.2],[6.8,48],[10.8,50.2],[25.2,54],[30.5,53.8],[22.5,51.6]], open: [[16.1,34.4],[7.3,32],[6.6,29.1],[15.7,26],[31.8,28.4],[51.9,26.1],[77.3,22.4],[96.3,20.3],[115.6,19.7],[147.6,24.6],[170.6,28.8],[185,29],[199.8,34.1],[200.9,52.1],[190.5,55.4],[164.2,69.9],[146.5,71.3],[114.2,76],[83.5,77],[53.5,69.4],[44.8,67],[13.7,60.5],[5.5,56.7],[8.2,51.4],[12.6,55],[25.6,56.3],[30.9,53.6],[23,40.4]] },
    gill: { closed: [[54.8,34.8],[59.4,38.7],[61.4,43.2],[61.2,50],[59.6,55],[52.8,63.6]], open: [[53,33.5],[56.8,35.5],[61.4,43.2],[61.2,50],[59.6,55],[52.8,63.6]] },
};
const SAL_EYE = { closed: [35.56, 42.06], open: [31.58, 38.3] };

// Catmull-Rom through the points, as cubic Béziers.
function salSmooth(pts, closed) {
    const p = pts, n = p.length;
    const get = i => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
    let d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
        const a = get(i - 1), b = get(i), c = get(i + 1), e = get(i + 2);
        d += ' C' + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + ',' + (b[1] + (c[1] - a[1]) / 6).toFixed(1)
           + ' ' + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + ',' + (c[1] - (e[1] - b[1]) / 6).toFixed(1)
           + ' ' + c[0].toFixed(1) + ',' + c[1].toFixed(1);
    }
    return d + (closed ? ' Z' : '');
}

function initSalmon(page) {
    const FISH = '<g data-fish opacity="0.9" filter="url(#sal-glow)"><g transform="translate(-127,-48)">'
        + '<g data-tail style="transform-origin:201px 43px"><use href="#sal-tail"/></g><use href="#sal-body"/></g></g>';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'salmon-layer');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs>${SAL_DEFS}</defs>`
        + `<g filter="url(#sal-warp)" fill="none" stroke="rgba(126,242,192,0.55)" stroke-width="1.4">${'<circle r="0"/>'.repeat(5)}</g>`
        + `<g fill="rgba(189,255,226,0.55)">${'<circle r="0"/>'.repeat(34)}</g>`
        + FISH.repeat(7);
    page.prepend(svg);

    const [, rippleGroup, bubbleGroup] = svg.children;
    const ripples = Array.from(rippleGroup.children, el => ({ el, alive: false }));
    const bubbles = Array.from(bubbleGroup.children, el => ({ el, alive: false }));
    const morph = {};
    svg.querySelectorAll('[data-morph]').forEach(el => { morph[el.dataset.morph] = el; });

    // Six school members (hidden until a school passes), then the resident.
    const fish = Array.from(svg.querySelectorAll('[data-fish]'), (node, i) => ({
        node, tail: node.querySelector('[data-tail]'), school: i < 6, active: i === 6,
        x: 0, y: 0, vx: 0, vy: 0, ph: Math.random() * 6, sc: 0.37, h: 0, sp: 0, bubbleIn: 0,
    }));
    const resident = fish[6];
    fish.forEach(f => { if (f.school) f.node.setAttribute('display', 'none'); });

    const mouse = { x: -1e4, y: -1e4, at: -1e4 };
    let W = 0, H = 0, visible = false;
    let willing = true, willingFlip = performance.now() + 5000 + Math.random() * 6000;
    let wanderX = 0, wanderY = 0, wanderUntil = 0;
    let nextSchool = performance.now() + 14000;
    let headingRef = 0, headingAt = 0, lastRipple = 0;
    let mt = 1, lastT = -1;

    // Re-checked on resize and media changes: deciding once would latch the layer off in contexts
    // that start narrow.
    const noMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const canHover = matchMedia('(hover: hover)');
    function evaluate() {
        W = document.documentElement.clientWidth;
        H = document.documentElement.clientHeight;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        visible = !noMotion.matches && canHover.matches && W >= 760;
        svg.toggleAttribute('hidden', !visible);
    }
    window.addEventListener('resize', evaluate);
    noMotion.addEventListener('change', evaluate);
    canHover.addEventListener('change', evaluate);
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.at = performance.now();
    }, { passive: true });

    function pickWander(now) {
        wanderX = 70 + Math.random() * Math.max(0, W - 140);
        wanderY = 70 + Math.random() * Math.max(0, H - 140);
        wanderUntil = now + 4000 + Math.random() * 5000;
    }

    // Steer toward a target: the cursor while chasing, else the wander point. Bounces off a 70px margin.
    function steer(f, tx, ty, chasing, dt) {
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
        const ease = Math.min(1, d / 80), k = chasing ? 3.0 : 1.5, spd = chasing ? 260 : 92;
        f.vx += ((dx / d) * spd * ease - f.vx) * k * dt;
        f.vy += ((dy / d) * spd * ease - f.vy) * k * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.x < 70) { f.x = 70; f.vx = Math.abs(f.vx); } else if (f.x > W - 70) { f.x = W - 70; f.vx = -Math.abs(f.vx); }
        if (f.y < 70) { f.y = 70; f.vy = Math.abs(f.vy); } else if (f.y > H - 70) { f.y = H - 70; f.vy = -Math.abs(f.vy); }
    }

    function draw(f, dt) {
        f.sp = Math.hypot(f.vx, f.vy);
        f.ph += (2.4 + f.sp * 0.03) * dt * 6; // tail beat scales with speed
        f.h = Math.atan2(f.vy, f.vx) * 180 / Math.PI;
        const flip = Math.abs(f.h) > 90 ? 1 : -1; // artwork faces -x, so mirror going right
        const ang = flip === 1 ? f.h + 180 : -f.h;
        const wob = Math.sin(f.ph) * Math.min(6, 1.4 + f.sp * 0.02);
        f.node.setAttribute('transform', `translate(${f.x.toFixed(1)},${f.y.toFixed(1)}) scale(${flip * f.sc},${f.sc}) rotate(${(ang + wob).toFixed(2)})`);
        f.tail.style.transform = `rotate(${(Math.sin(f.ph - 0.9) * Math.min(18, 5 + f.sp * 0.07)).toFixed(2)}deg)`;
    }

    function launchSchool() {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const y = H * (0.2 + Math.random() * 0.6);
        const idle = fish.filter(f => f.school && !f.active);
        idle.slice(0, 4 + Math.floor(Math.random() * 3)).forEach(f => {
            f.active = true;
            f.dir = dir;
            f.sc = 0.19 + Math.random() * 0.13;
            f.base = 0.5 + f.sc;
            f.x = dir > 0 ? -120 - Math.random() * 260 : W + 120 + Math.random() * 260;
            f.y0 = y + (Math.random() * 2 - 1) * 85;
            f.speed = 70 + Math.random() * 40;
            f.wave = Math.random() * Math.PI * 2;
            f.fade = 0;
            f.node.removeAttribute('display');
        });
    }

    // School fish cross at a steady speed on a slow vertical sine, fading in, and fading out once
    // past the far edge.
    function swimSchool(f, dt) {
        f.wave += dt * 0.9;
        f.vx = f.dir * f.speed;
        f.vy = Math.cos(f.wave) * 0.9 * 14;
        f.x += f.vx * dt;
        f.y = f.y0 + Math.sin(f.wave) * 14;
        f.fade = Math.min(1, f.fade + dt);
        const past = f.dir > 0 ? f.x - W : -f.x;
        if (past > 200) {
            f.active = false;
            f.node.setAttribute('display', 'none');
            return;
        }
        f.node.setAttribute('opacity', (f.base * f.fade * Math.min(1, 1 - past / 200)).toFixed(3));
        draw(f, dt);
    }

    function emitBubble(f) {
        const b = bubbles.find(b => !b.alive);
        if (!b) return;
        const hr = f.h * Math.PI / 180;
        Object.assign(b, {
            alive: true, age: 0,
            x: f.x - Math.cos(hr) * 105 * f.sc, y: f.y - Math.sin(hr) * 105 * f.sc - 4,
            r: 0.9 + Math.random() * 1.7, vx: (Math.random() * 2 - 1) * 6, vy: -8 - Math.random() * 14 - f.sp * 0.05,
        });
    }

    function updateBubbles(dt) {
        for (const b of bubbles) {
            if (!b.alive) continue;
            b.age += dt;
            if (b.age >= 2.4) { b.alive = false; b.el.setAttribute('r', 0); continue; }
            const life = 1 - b.age / 2.4;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.el.setAttribute('cx', b.x.toFixed(1));
            b.el.setAttribute('cy', b.y.toFixed(1));
            b.el.setAttribute('r', (b.r * (0.3 + 0.7 * life)).toFixed(2));
            b.el.setAttribute('opacity', (0.5 * life).toFixed(3));
        }
    }

    function fireRipple(x, y) {
        const r = ripples.find(r => !r.alive);
        if (r) Object.assign(r, { alive: true, age: 0, x, y });
    }

    function updateRipples(dt) {
        for (const r of ripples) {
            if (!r.alive) continue;
            r.age += dt;
            if (r.age >= 0.95) { r.alive = false; r.el.setAttribute('r', 0); continue; }
            const k = r.age / 0.95;
            r.el.setAttribute('cx', r.x.toFixed(1));
            r.el.setAttribute('cy', r.y.toFixed(1));
            r.el.setAttribute('r', (8 + 54 * (1 - (1 - k) * (1 - k))).toFixed(1));
            r.el.setAttribute('opacity', (0.5 * (1 - k)).toFixed(3));
        }
    }

    // The mouth rides open and closes when the resident reaches the cursor.
    function mouth(dt, chasing) {
        const near = chasing ? Math.hypot(mouse.x - resident.x, mouse.y - resident.y) : 1e4;
        const target = near < 95 ? 0 : 1;
        mt += (target - mt) * Math.min(1, dt * (target === 0 ? 9 : 3.5));
        const t = mt * mt * (3 - 2 * mt);
        if (Math.abs(t - lastT) < 0.004) return;
        lastT = t;
        for (const k of ['body', 'gill']) {
            const m = SAL_MORPH[k];
            const pts = m.closed.map((c, i) => [c[0] + (m.open[i][0] - c[0]) * t, c[1] + (m.open[i][1] - c[1]) * t]);
            morph[k].setAttribute('d', salSmooth(pts, k === 'body'));
        }
        const ex = (SAL_EYE.closed[0] + (SAL_EYE.open[0] - SAL_EYE.closed[0]) * t).toFixed(2);
        const ey = (SAL_EYE.closed[1] + (SAL_EYE.open[1] - SAL_EYE.closed[1]) * t).toFixed(2);
        [morph.eye, morph.pupil].forEach(e => { e.setAttribute('cx', ex); e.setAttribute('cy', ey); });
    }

    function step(now, dt) {
        if (now > willingFlip) {
            willing = Math.random() < 0.72; // comes to the cursor most of the time, not every time
            willingFlip = now + 5000 + Math.random() * 6000;
        }
        const chasing = willing && now - mouse.at < 2400;

        if (!chasing && (now > wanderUntil || Math.hypot(wanderX - resident.x, wanderY - resident.y) < 60)) pickWander(now);
        steer(resident, chasing ? mouse.x : wanderX, chasing ? mouse.y : wanderY, chasing, dt);
        draw(resident, dt);

        // A hard turn by the resident sends out a ripple.
        if (now - headingAt > 200) {
            let turn = Math.abs(resident.h - headingRef) % 360;
            if (turn > 180) turn = 360 - turn;
            if (turn > 22 && resident.sp > 90 && now - lastRipple > 700) {
                fireRipple(resident.x, resident.y);
                lastRipple = now;
            }
            headingRef = resident.h;
            headingAt = now;
        }

        if (now > nextSchool) {
            launchSchool();
            nextSchool = now + 45000 + Math.random() * 50000;
        }
        for (const f of fish) {
            if (f.school && f.active) swimSchool(f, dt);
            if (!f.active || f.x < 0 || f.x > W) continue;
            f.bubbleIn -= dt * 1000;
            if (f.bubbleIn <= 0) {
                emitBubble(f);
                f.bubbleIn = 150 + Math.random() * 190;
            }
        }
        updateBubbles(dt);
        updateRipples(dt);
        mouth(dt, chasing);
    }

    evaluate();
    resident.x = W * (0.3 + Math.random() * 0.5);
    resident.y = H * (0.3 + Math.random() * 0.4);
    resident.vx = -40;
    pickWander(performance.now());
    step(performance.now(), 1 / 60); // position the fish before the first animation frame

    let last = performance.now();
    requestAnimationFrame(function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
        last = now;
        if (visible) step(now, dt); // the loop stays alive while hidden but skips its work
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('.page');
    if (page) initSalmon(page);

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
