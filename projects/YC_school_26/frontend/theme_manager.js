// ============================================================
// THEME MANAGER — 3 SF-themed visual presets, transitions every 10 lines
// Themes: 0=Golden Gate Fog, 1=Chinatown Neon, 2=Mission Murals
// ============================================================

const THEMES = [
  {
    name: 'Golden Gate Fog',
    lineRange: '1–10',
    background: '#1a0800',
    gridColor: 'rgba(255,100,40,0.12)',
    panelBg: 'rgba(30,10,0,0.85)',
    panelBorder: 'rgba(255,100,40,0.3)',
    blockColors: {
      I: '#FF6B35', O: '#FFB347', T: '#CC4400',
      S: '#FF8C42', Z: '#E63900', L: '#FFC87A', J: '#B33000',
    },
    blockHighlight: '#FFD4A0',
    blockShadow: '#5A1A00',
    ghostColor: 'rgba(255,107,53,0.18)',
    accentColor: '#FF4500',
    textGlow: '#FF8C00',
    textColor: '#FFD4A0',
    particleConfig: { type: 'fog', color: 'rgba(255,180,120,0.06)', count: 3 },
    bgDecorator: 'bridge',
  },
  {
    name: 'Chinatown Neon',
    lineRange: '11–20',
    background: '#0A0014',
    gridColor: 'rgba(255,0,128,0.1)',
    panelBg: 'rgba(10,0,20,0.85)',
    panelBorder: 'rgba(255,0,128,0.3)',
    blockColors: {
      I: '#00FFFF', O: '#FFD700', T: '#FF1493',
      S: '#00FF88', Z: '#FF6B9D', L: '#FFB3DE', J: '#9B59B6',
    },
    blockHighlight: '#FFFFFF',
    blockShadow: '#330033',
    ghostColor: 'rgba(0,255,255,0.15)',
    accentColor: '#FF1493',
    textGlow: '#00FFFF',
    textColor: '#FFD700',
    particleConfig: { type: 'lantern', color: '#FFD700', count: 1 },
    bgDecorator: 'lanterns',
  },
  {
    name: 'Mission Murals',
    lineRange: '21+',
    background: '#0D0D0D',
    gridColor: 'rgba(118,255,3,0.08)',
    panelBg: 'rgba(13,13,13,0.85)',
    panelBorder: 'rgba(118,255,3,0.3)',
    blockColors: {
      I: '#00E5FF', O: '#FFEA00', T: '#E040FB',
      S: '#76FF03', Z: '#FF6D00', L: '#FF4081', J: '#40C4FF',
    },
    blockHighlight: '#FFFFFF',
    blockShadow: '#1A1A2E',
    ghostColor: 'rgba(118,255,3,0.15)',
    accentColor: '#76FF03',
    textGlow: '#E040FB',
    textColor: '#FFEA00',
    particleConfig: { type: 'spray', color: 'rgba(255,255,255,0.04)', count: 2 },
    bgDecorator: 'graffiti',
  },
];

const TRANSITION_DURATION = 600; // ms

class ThemeManager {
  constructor() {
    this._themeIndex = 0;
    this._prevIndex = 0;
    this._transitionTimer = 0;
    this._transitioning = false;
  }

  getThemeIndex() {
    return this._themeIndex;
  }

  getCurrentTheme() {
    if (!this._transitioning) return THEMES[this._themeIndex];

    const t = Math.min(this._transitionTimer / TRANSITION_DURATION, 1);
    // White flash in first 15% of transition, then blend
    if (t < 0.15) {
      return this._blendThemes(THEMES[this._prevIndex], THEMES[this._themeIndex], 0);
    }
    const blendT = (t - 0.15) / 0.85;
    return this._blendThemes(THEMES[this._prevIndex], THEMES[this._themeIndex], blendT);
  }

  getTransitionFlashAlpha() {
    if (!this._transitioning) return 0;
    const t = this._transitionTimer / TRANSITION_DURATION;
    if (t < 0.08) return t / 0.08;        // ramp up
    if (t < 0.15) return 1 - (t - 0.08) / 0.07; // ramp down
    return 0;
  }

  isTransitioning() {
    return this._transitioning;
  }

  // Called whenever lines changes — triggers transition at multiples of 10
  checkTransition(totalLines) {
    const newIndex = Math.min(Math.floor(totalLines / 10), THEMES.length - 1);
    if (newIndex !== this._themeIndex) {
      this._prevIndex = this._themeIndex;
      this._themeIndex = newIndex;
      this._transitioning = true;
      this._transitionTimer = 0;
    }
  }

  update(dt) {
    if (!this._transitioning) return;
    this._transitionTimer += dt;
    if (this._transitionTimer >= TRANSITION_DURATION) {
      this._transitioning = false;
      this._transitionTimer = 0;
    }
  }

  // ── Color blending ────────────────────────────────────────

  _blendThemes(a, b, t) {
    if (t <= 0) return a;
    if (t >= 1) return b;

    const lerp = (c1, c2) => this._lerpColor(c1, c2, t);
    const lerpObj = (o1, o2) => {
      const out = {};
      for (const k of Object.keys(o1)) out[k] = lerp(o1[k], o2[k]);
      return out;
    };

    return {
      name: b.name,
      lineRange: b.lineRange,
      background: lerp(a.background, b.background),
      gridColor: lerp(a.gridColor, b.gridColor),
      panelBg: lerp(a.panelBg, b.panelBg),
      panelBorder: lerp(a.panelBorder, b.panelBorder),
      blockColors: lerpObj(a.blockColors, b.blockColors),
      blockHighlight: lerp(a.blockHighlight, b.blockHighlight),
      blockShadow: lerp(a.blockShadow, b.blockShadow),
      ghostColor: lerp(a.ghostColor, b.ghostColor),
      accentColor: lerp(a.accentColor, b.accentColor),
      textGlow: lerp(a.textGlow, b.textGlow),
      textColor: lerp(a.textColor, b.textColor),
      particleConfig: b.particleConfig,
      bgDecorator: b.bgDecorator,
    };
  }

  // Parse hex or rgba string, lerp each channel, return rgba string
  _lerpColor(c1, c2, t) {
    const p1 = this._parseColor(c1);
    const p2 = this._parseColor(c2);
    if (!p1 || !p2) return t < 0.5 ? c1 : c2;
    const r = Math.round(p1[0] + (p2[0] - p1[0]) * t);
    const g = Math.round(p1[1] + (p2[1] - p1[1]) * t);
    const b = Math.round(p1[2] + (p2[2] - p1[2]) * t);
    const a = p1[3] + (p2[3] - p1[3]) * t;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  _parseColor(str) {
    if (!str) return null;
    // rgba(r,g,b,a)
    const rgba = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgba) return [+rgba[1], +rgba[2], +rgba[3], rgba[4] !== undefined ? +rgba[4] : 1];
    // #RRGGBB or #RGB
    const hex = str.match(/^#([0-9a-fA-F]+)$/);
    if (hex) {
      const h = hex[1];
      if (h.length === 3) {
        return [
          parseInt(h[0]+h[0], 16), parseInt(h[1]+h[1], 16), parseInt(h[2]+h[2], 16), 1
        ];
      }
      if (h.length === 6) {
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 1];
      }
    }
    return null;
  }
}
