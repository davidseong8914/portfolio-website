// ============================================================
// RENDERER — full canvas pipeline, 15-layer draw order
// Reads from renderState snapshot; never mutates game state.
// ============================================================

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // Layout computed by resize()
    this.cellSize = 28;
    this.boardOffsetX = 0;
    this.boardOffsetY = 0;
    this.canvasLogW = 0;
    this.canvasLogH = 0;

    // YC logo image for Y-piece blocks
    this._ycLogo = new Image();
    this._ycLogo.src = 'YC_school_26/frontend/yc_logo.png';

    // Effects
    this._shake = { x: 0, y: 0, timer: 0, duration: 0, intensity: 0 };
    this._popups = [];
    this._lineClearAnim = { rows: [], progress: 0, active: false };

    this.resize();
  }

  // ── Layout ────────────────────────────────────────────────

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Layout: leftPanel(5) + board(10) + rightPanel(5) = 20 cols, height 24 rows
    const maxByW = Math.floor(vw / 20);
    const maxByH = Math.floor(vh / 24);
    this.cellSize = Math.max(14, Math.min(maxByW, maxByH));

    const panelCols = 5;
    this.canvasLogW = (panelCols * 2 + COLS) * this.cellSize;
    this.canvasLogH = 24 * this.cellSize;
    this.boardOffsetX = panelCols * this.cellSize;
    this.boardOffsetY = 2 * this.cellSize;

    this.canvas.width = Math.round(this.canvasLogW * this.dpr);
    this.canvas.height = Math.round(this.canvasLogH * this.dpr);
    this.canvas.style.width = this.canvasLogW + 'px';
    this.canvas.style.height = this.canvasLogH + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ── Main render entry ─────────────────────────────────────

  render(rs, theme, particles, screenManager) {
    const ctx = this.ctx;
    const W = this.canvasLogW;
    const H = this.canvasLogH;
    const cs = this.cellSize;
    const bx = this.boardOffsetX;
    const by = this.boardOffsetY;

    // 1. Background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, W, H);

    // 2. Background decorator
    this._drawBgDecorator(theme, W, H);

    // 3. Ambient particles — background layer (behind board)
    particles.drawBg(ctx);

    // 4. Screen shake transform
    this._updateShake();
    ctx.save();
    ctx.translate(this._shake.x, this._shake.y);

    // 5. Grid lines
    this._drawGrid(theme, bx, by, cs);

    // 6. Locked board blocks
    this._drawBoard(rs.grid, theme, bx, by, cs);

    // 7. Ghost piece
    if (rs.currentPiece && rs.phase === 'playing') {
      this._drawGhost(rs.currentPiece.ghostCells, theme, bx, by, cs);
    }

    // 8. Active piece
    if (rs.currentPiece && rs.phase === 'playing') {
      const ptype = rs.currentPiece.type;
      const color = theme.blockColors[ptype];
      for (const [r, c] of rs.currentPiece.cells) {
        if (r >= HIDDEN_ROWS) {
          const px = bx + c * cs;
          const py = by + (r - HIDDEN_ROWS) * cs;
          if (ptype === 'Y') {
            this._drawYBlock(ctx, px, py, cs);
          } else {
            this._drawBlock(ctx, px, py, cs, color, theme.blockHighlight, theme.blockShadow, 1);
          }
        }
      }
    }

    // 9. Line clear animation overlay
    if (this._lineClearAnim.active) {
      this._drawLineClearAnim(theme, bx, by, cs);
    }

    // 10. Effect particles — foreground layer (in front of board)
    particles.drawFg(ctx);

    // 11. Reset screen shake
    ctx.restore();

    // 12. UI panels
    this._drawUI(rs, theme, bx, by, cs, W, H);

    // 13. Text popups
    this._drawPopups(ctx);

    // 14. Theme transition flash
    const flashAlpha = window._themeManager ? window._themeManager.getTransitionFlashAlpha() : 0;
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 15. Screen overlays (start/pause/gameover) — delegated to ScreenManager
    if (screenManager) {
      screenManager.draw(ctx, W, H, rs, theme);
    }
  }

  // ── Effects API ───────────────────────────────────────────

  triggerScreenShake(intensity, duration) {
    this._shake.intensity = intensity;
    this._shake.duration = duration;
    this._shake.timer = duration;
  }

  addTextPopup(text, x, y, color) {
    this._popups.push({
      text, x, y,
      color: color || '#FFFFFF',
      timer: 1200,
      maxTimer: 1200,
      vy: -0.04,
    });
  }

  startLineClearAnim(rows) {
    this._lineClearAnim = { rows: [...rows], progress: 0, active: true };
  }

  updateEffects(dt) {
    // Advance line clear anim
    if (this._lineClearAnim.active) {
      this._lineClearAnim.progress += dt / LINE_CLEAR_ANIM_MS;
      if (this._lineClearAnim.progress >= 1) {
        this._lineClearAnim.active = false;
      }
    }
    // Advance popups
    for (let i = this._popups.length - 1; i >= 0; i--) {
      const p = this._popups[i];
      p.timer -= dt;
      p.y += p.vy * dt;
      if (p.timer <= 0) this._popups.splice(i, 1);
    }
  }

  // ── Private: draw helpers ─────────────────────────────────

  _drawBlock(ctx, x, y, cs, fill, highlight, shadow, opacity) {
    if (opacity < 1) ctx.globalAlpha = opacity;

    // Base
    ctx.fillStyle = fill;
    ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

    // Top-left highlight
    ctx.fillStyle = highlight;
    ctx.fillRect(x + 1, y + 1, cs - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, cs - 2);

    // Bottom-right shadow
    ctx.fillStyle = shadow;
    ctx.fillRect(x + 1, y + cs - 3, cs - 2, 2);
    ctx.fillRect(x + cs - 3, y + 1, 2, cs - 2);

    // Inner border
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 1.5, y + 1.5, cs - 3, cs - 3);

    if (opacity < 1) ctx.globalAlpha = 1;
  }

  _drawGrid(theme, bx, by, cs) {
    const ctx = this.ctx;
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(bx + c * cs, by);
      ctx.lineTo(bx + c * cs, by + ROWS * cs);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(bx, by + r * cs);
      ctx.lineTo(bx + COLS * cs, by + r * cs);
      ctx.stroke();
    }
    // Board border
    ctx.strokeStyle = theme.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, COLS * cs, ROWS * cs);
  }

  _drawBoard(grid, theme, bx, by, cs) {
    for (let r = HIDDEN_ROWS; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = grid[r][c];
        if (!type) continue;
        const color = theme.blockColors[type];
        const x = bx + c * cs;
        const y = by + (r - HIDDEN_ROWS) * cs;
        if (type === 'Y') {
          this._drawYBlock(this.ctx, x, y, cs);
        } else {
          this._drawBlock(this.ctx, x, y, cs, color, theme.blockHighlight, theme.blockShadow, 1);
        }
      }
    }
  }

  _drawGhost(cells, theme, bx, by, cs) {
    const ctx = this.ctx;
    for (const [r, c] of cells) {
      if (r < HIDDEN_ROWS) continue;
      const x = bx + c * cs;
      const y = by + (r - HIDDEN_ROWS) * cs;
      ctx.fillStyle = theme.ghostColor;
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      ctx.strokeStyle = theme.accentColor;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1.5, y + 1.5, cs - 3, cs - 3);
      ctx.globalAlpha = 1;
    }
  }

  _drawLineClearAnim(theme, bx, by, cs) {
    const ctx = this.ctx;
    const p = this._lineClearAnim.progress;
    for (const r of this._lineClearAnim.rows) {
      if (r < HIDDEN_ROWS) continue;
      const y = by + (r - HIDDEN_ROWS) * cs;
      if (p < 0.35) {
        // White flash
        const alpha = p < 0.2 ? (p / 0.2) : 1 - ((p - 0.2) / 0.15);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
        ctx.fillRect(bx, y, COLS * cs, cs);
      } else {
        // Dissolve: cover row with theme accent
        const alpha = 1 - ((p - 0.35) / 0.65);
        ctx.fillStyle = theme.accentColor;
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillRect(bx, y, COLS * cs, cs);
        ctx.globalAlpha = 1;
      }
    }
  }

  _drawUI(rs, theme, bx, by, cs, W, H) {
    const ctx = this.ctx;
    const panelW = bx - cs * 0.5;
    const rightX = bx + COLS * cs + cs * 0.5;

    // ── Left panel: Hold ──────────────────────────────────
    this._drawPanel(ctx, cs * 0.25, by, panelW - cs * 0.25, cs * 5, theme, 'HOLD');
    if (rs.holdPiece) {
      this._drawMiniPiece(ctx, rs.holdPiece, cs * 0.25 + (panelW - cs * 0.25) / 2,
        by + cs * 2.2, cs * 0.7, theme, rs.holdUsed ? 0.35 : 1);
    }

    // ── Left panel: Time + Level ───────────────────────────
    const timeY = by + cs * 6;
    this._drawPanel(ctx, cs * 0.25, timeY, panelW - cs * 0.25, cs * 4.5, theme, 'STATS');

    ctx.fillStyle = theme.textColor;
    ctx.font = `bold ${cs * 0.55}px monospace`;
    ctx.textAlign = 'center';
    const elapsed = rs.elapsedTime || 0;
    const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    ctx.fillText(`${mm}:${ss}`, cs * 0.25 + (panelW - cs * 0.25) / 2, timeY + cs * 1.5);
    ctx.font = `${cs * 0.42}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText('TIME', cs * 0.25 + (panelW - cs * 0.25) / 2, timeY + cs * 2.1);
    ctx.fillStyle = theme.textColor;
    ctx.font = `bold ${cs * 0.65}px monospace`;
    ctx.fillText(`${rs.level}`, cs * 0.25 + (panelW - cs * 0.25) / 2, timeY + cs * 3.3);
    ctx.font = `${cs * 0.42}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText('LVL', cs * 0.25 + (panelW - cs * 0.25) / 2, timeY + cs * 3.9);

    // ── Right panel: Next queue ───────────────────────────
    const nextPanelH = cs * 14;
    this._drawPanel(ctx, rightX, by, W - rightX - cs * 0.25, nextPanelH, theme, 'NEXT');
    const nextCX = rightX + (W - rightX - cs * 0.25) / 2;
    for (let i = 0; i < Math.min(5, rs.nextQueue.length); i++) {
      const scale = i === 0 ? 0.72 : 0.52;
      const yPos = by + cs * 1.6 + i * cs * 2.4;
      this._drawMiniPiece(ctx, rs.nextQueue[i], nextCX, yPos, cs * scale, theme, 1);
    }

    // ── Right panel: Score ───────────────────────────────
    const scoreY = by + nextPanelH + cs * 0.5;
    const scorePanelH = cs * 4;
    this._drawPanel(ctx, rightX, scoreY, W - rightX - cs * 0.25, scorePanelH, theme, 'SCORE');
    ctx.fillStyle = theme.textColor;
    ctx.font = `bold ${cs * 0.6}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(String(rs.score).padStart(7, '0'), nextCX, scoreY + cs * 2.0);
    ctx.font = `${cs * 0.42}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText(`LINES ${rs.lines}`, nextCX, scoreY + cs * 2.9);

    // Combo indicator
    if (rs.combo > 0) {
      ctx.font = `bold ${cs * 0.5}px monospace`;
      ctx.fillStyle = theme.accentColor;
      ctx.shadowColor = theme.textGlow;
      ctx.shadowBlur = 8;
      ctx.fillText(`COMBO ×${rs.combo}`, nextCX, scoreY + cs * 3.7);
      ctx.shadowBlur = 0;
    }

    // Theme name indicator (bottom)
    ctx.font = `${cs * 0.35}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'center';
    ctx.fillText(theme.name.toUpperCase(), W / 2, H - cs * 0.4);
    ctx.globalAlpha = 1;
  }

  _drawPanel(ctx, x, y, w, h, theme, label) {
    ctx.fillStyle = theme.panelBg;
    ctx.strokeStyle = theme.panelBorder;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    if (label) {
      ctx.fillStyle = theme.textGlow;
      ctx.font = `${this.cellSize * 0.38}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + this.cellSize * 0.6);
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  _drawMiniPiece(ctx, type, cx, cy, scale, theme, opacity) {
    const offsets = PIECE_SHAPES[type][0];
    const color = theme.blockColors[type];
    // Find bounding box center
    const rows = offsets.map(([r]) => r);
    const cols = offsets.map(([, c]) => c);
    const cRow = (Math.min(...rows) + Math.max(...rows)) / 2;
    const cCol = (Math.min(...cols) + Math.max(...cols)) / 2;

    ctx.globalAlpha = opacity;
    for (const [r, c] of offsets) {
      const x = cx + (c - cCol - 0.5) * scale;
      const y = cy + (r - cRow - 0.5) * scale;
      if (type === 'Y') {
        this._drawYBlock(ctx, x, y, scale, opacity);
      } else {
        this._drawBlock(ctx, x, y, scale, color, theme.blockHighlight, theme.blockShadow, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawPopups(ctx) {
    for (const p of this._popups) {
      const alpha = Math.min(1, p.timer / (p.maxTimer * 0.4));
      const size = this.cellSize * 0.75;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${size}px monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // Draws the YC logo image as the entire block face for the Y piece.
  // Falls back to an orange square with "Y" while the image is loading.
  _drawYBlock(ctx, x, y, cs, opacity) {
    ctx.save();
    if (opacity !== undefined && opacity < 1) ctx.globalAlpha = opacity;
    if (this._ycLogo.complete && this._ycLogo.naturalWidth > 0) {
      ctx.drawImage(this._ycLogo, x, y, cs, cs);
    } else {
      // Fallback while image loads
      ctx.fillStyle = '#F26522';
      ctx.fillRect(x, y, cs, cs);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(cs * 0.62)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Y', x + cs / 2, y + cs / 2);
    }
    ctx.restore();
  }

  // ── Background decorators ─────────────────────────────────

  _drawBgDecorator(theme, W, H) {
    const ctx = this.ctx;
    const dec = theme.bgDecorator;

    if (dec === 'bridge') {
      this._drawBridge(ctx, W, H, theme);
    } else if (dec === 'lanterns') {
      this._drawLanterns(ctx, W, H, theme);
    } else if (dec === 'graffiti') {
      this._drawGraffiti(ctx, W, H, theme);
    }
  }

  _drawBridge(ctx, W, H) {
    // Simplified Golden Gate Bridge silhouette at bottom
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#CC3300';
    const baseY = H * 0.92;
    const towerH = H * 0.22;

    // Road deck
    ctx.fillRect(0, baseY, W, H * 0.025);

    // Left tower
    ctx.fillRect(W * 0.18, baseY - towerH, W * 0.025, towerH);
    ctx.fillRect(W * 0.13, baseY - towerH * 0.65, W * 0.125, towerH * 0.04); // crossbar

    // Right tower
    ctx.fillRect(W * 0.75, baseY - towerH, W * 0.025, towerH);
    ctx.fillRect(W * 0.70, baseY - towerH * 0.65, W * 0.125, towerH * 0.04);

    // Suspension cables (quadratic curves)
    ctx.strokeStyle = '#CC3300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, baseY - towerH);
    ctx.quadraticCurveTo(W * 0.46, baseY - towerH * 0.35, W * 0.775, baseY - towerH);
    ctx.stroke();
    ctx.restore();
  }

  _drawLanterns(ctx, W, H, theme) {
    // Static decorative lanterns — positions and sizes are fixed (no Math.random in render path)
    ctx.save();
    ctx.globalAlpha = 0.09;
    const lanterns = [
      [0.10, 0.15, 12], [0.25, 0.08, 9], [0.70, 0.12, 14],
      [0.85, 0.20, 10], [0.50, 0.05, 11],
    ];
    for (const [px, py, r] of lanterns) {
      const x = W * px;
      const y = H * py;
      ctx.fillStyle = '#FF4488';
      ctx.shadowColor = '#FF1493';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.65, r, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hanging string
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(200,200,200,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x, y - r - 16);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawGraffiti(ctx, W, H, theme) {
    // Abstract bezier "tag" shapes suggesting graffiti
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const tags = [
      { x: W * 0.05, y: H * 0.3 },
      { x: W * 0.8, y: H * 0.6 },
      { x: W * 0.15, y: H * 0.75 },
    ];
    for (const { x, y } of tags) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 30, y - 25, x + 60, y + 20, x + 80, y - 10);
      ctx.bezierCurveTo(x + 100, y - 35, x + 50, y + 40, x + 20, y + 30);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Screen shake ──────────────────────────────────────────

  _updateShake() {
    if (this._shake.timer <= 0) {
      this._shake.x = 0;
      this._shake.y = 0;
      return;
    }
    const progress = this._shake.timer / this._shake.duration;
    const mag = this._shake.intensity * progress;
    this._shake.x = (Math.random() - 0.5) * mag;
    this._shake.y = (Math.random() - 0.5) * mag;
  }

  advanceShake(dt) {
    if (this._shake.timer > 0) this._shake.timer -= dt;
  }

  // ── Convenience getters for game loop ─────────────────────

  getBoardCenter() {
    return {
      x: this.boardOffsetX + (COLS / 2) * this.cellSize,
      y: this.boardOffsetY + (ROWS / 2) * this.cellSize,
    };
  }
}
