// ============================================================
// PARTICLE SYSTEM — ambient background + line clear + celebration
// ============================================================

class ParticleSystem {
  constructor() {
    this._particles = [];
    this._ambientTimer = 0;
  }

  update(dt) {
    this._ambientTimer += dt;
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this._particles.splice(i, 1);
    }
  }

  drawBg(ctx) { this._drawLayer(ctx, 'bg'); }
  drawFg(ctx) { this._drawLayer(ctx, 'fg'); }

  _drawLayer(ctx, layer) {
    for (const p of this._particles) {
      if (p.layer !== layer) continue;
      this._drawParticle(ctx, p);
    }
  }

  _drawParticle(ctx, p) {
    const alpha = Math.max(0, p.life / p.maxLife) * p.opacity;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.type === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'rect') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else if (p.type === 'lantern') {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Emit ambient particles based on current theme config
  emitAmbient(theme, canvasW, canvasH) {
    const cfg = theme.particleConfig;
    const interval = 1000 / Math.max(cfg.count, 0.5);
    if (this._ambientTimer < interval) return;
    this._ambientTimer = 0;

    if (cfg.type === 'fog') {
      this._particles.push({
        x: Math.random() * canvasW,
        y: Math.random() * canvasH,
        vx: (Math.random() - 0.3) * 0.015,
        vy: (Math.random() - 0.5) * 0.005,
        life: 6000 + Math.random() * 4000,
        maxLife: 10000,
        size: 40 + Math.random() * 80,
        color: cfg.color,
        type: 'circle',
        opacity: 0.6,
        layer: 'bg',
      });
    } else if (cfg.type === 'lantern') {
      this._particles.push({
        x: Math.random() * canvasW,
        y: canvasH + 20,
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.04 - Math.random() * 0.03,
        life: 8000 + Math.random() * 4000,
        maxLife: 12000,
        size: 6 + Math.random() * 8,
        color: cfg.color,
        type: 'lantern',
        opacity: 0.7,
        layer: 'bg',
      });
    } else if (cfg.type === 'spray') {
      this._particles.push({
        x: Math.random() * canvasW,
        y: Math.random() * canvasH,
        vx: (Math.random() - 0.5) * 0.01,
        vy: (Math.random() - 0.5) * 0.01,
        life: 3000 + Math.random() * 2000,
        maxLife: 5000,
        size: 2 + Math.random() * 4,
        color: cfg.color,
        type: 'rect',
        opacity: 0.8,
        layer: 'bg',
      });
    }
  }

  // Pixel-dissolve burst along cleared rows
  emitLineClear(rows, cellSize, boardOffsetX, boardOffsetY) {
    for (const r of rows) {
      const y = boardOffsetY + (r - HIDDEN_ROWS) * cellSize + cellSize / 2;
      for (let c = 0; c < COLS; c++) {
        const x = boardOffsetX + c * cellSize + cellSize / 2;
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.05 + Math.random() * 0.15;
          this._particles.push({
            x: x + (Math.random() - 0.5) * cellSize,
            y: y + (Math.random() - 0.5) * cellSize,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 300 + Math.random() * 400,
            maxLife: 700,
            size: 2 + Math.random() * 3,
            color: '#FFFFFF',
            type: 'rect',
            opacity: 0.9,
            layer: 'fg',
          });
        }
      }
    }
  }

  // Radial celebration burst for T-spin/Tetris
  emitCelebration(cx, cy, color) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.25;
      this._particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        size: 3 + Math.random() * 5,
        color,
        type: 'circle',
        opacity: 1,
        layer: 'fg',
      });
    }
  }

  clear() {
    this._particles = [];
    this._ambientTimer = 0;
  }
}
