// ============================================================
// SCREEN MANAGER — draws overlay screens (start, pause, gameover)
// Does not modify game state; pure canvas drawing.
// ============================================================

class ScreenManager {
  constructor() {
    this._startPulse = 0; // for pulsing "press start" text
  }

  update(dt) {
    this._startPulse = (this._startPulse + dt * 0.003) % (Math.PI * 2);
  }

  // Called each frame AFTER renderer.render()
  draw(ctx, W, H, rs, theme) {
    if (rs.phase === 'start') {
      this._drawStartScreen(ctx, W, H, theme);
    } else if (rs.phase === 'paused') {
      this._drawPauseOverlay(ctx, W, H, theme);
    } else if (rs.phase === 'gameover') {
      this._drawGameOverScreen(ctx, W, H, rs, theme);
    }
  }

  // ── Start screen ──────────────────────────────────────────

  _drawStartScreen(ctx, W, H, theme) {
    // Semi-transparent backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cs = Math.min(W, H) / 20;

    // Title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `bold ${cs * 2.2}px monospace`;
    ctx.shadowColor = theme.textGlow;
    ctx.shadowBlur = 24;
    ctx.fillStyle = theme.accentColor;
    ctx.font = `bold ${cs * 1.5}px monospace`;
    ctx.fillStyle = theme.textColor;
    ctx.fillText('YC-BLOCKS', cx, H * 0.25 + cs * 2.0);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = `${cs * 0.5}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText('San Francisco Edition', cx, H * 0.25 + cs * 2.9);

    // Controls
    const controlsY = H * 0.52;
    ctx.font = `${cs * 0.48}px monospace`;
    ctx.fillStyle = theme.textColor;
    ctx.globalAlpha = 0.75;
    const controls = [
      ['←→', 'Move'],
      ['↑ / Z', 'Rotate CW / CCW'],
      ['↓', 'Soft Drop'],
      ['Space', 'Hard Drop'],
      ['Shift / C', 'Hold'],
      ['P / Esc', 'Pause'],
    ];
    for (let i = 0; i < controls.length; i++) {
      const [key, action] = controls[i];
      const y = controlsY + i * cs * 0.85;
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(key, cx - cs * 0.3, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.textColor;
      ctx.fillText(action, cx + cs * 0.3, y);
    }
    ctx.globalAlpha = 1;

    // Press SPACE to start — pulsing
    const pulse = 0.6 + 0.4 * Math.sin(this._startPulse);
    ctx.globalAlpha = pulse;
    ctx.font = `bold ${cs * 0.65}px monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = theme.textGlow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = theme.textColor;
    ctx.fillText('PRESS SPACE TO START', cx, H * 0.9);
    ctx.font = `${cs * 0.45}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText('(or tap on mobile)', cx, H * 0.9 + cs * 0.8);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // ── Pause overlay ─────────────────────────────────────────

  _drawPauseOverlay(ctx, W, H, theme) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cs = Math.min(W, H) / 20;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `bold ${cs * 1.8}px monospace`;
    ctx.shadowColor = theme.textGlow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = theme.textColor;
    ctx.fillText('PAUSED', cx, H * 0.45);
    ctx.font = `${cs * 0.5}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.shadowBlur = 0;
    ctx.fillText('Press P or Esc to resume', cx, H * 0.45 + cs * 1.5);
    ctx.restore();
  }

  // ── Game over screen ──────────────────────────────────────

  _drawGameOverScreen(ctx, W, H, rs, theme) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cs = Math.min(W, H) / 20;

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    ctx.font = `bold ${cs * 1.6}px monospace`;
    ctx.shadowColor = theme.accentColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = theme.accentColor;
    ctx.fillText('GAME OVER', cx, H * 0.14);
    ctx.shadowBlur = 0;

    // Final stats
    ctx.font = `bold ${cs * 0.65}px monospace`;
    ctx.fillStyle = theme.textColor;
    ctx.fillText(String(rs.score).padStart(8, '0'), cx, H * 0.25);
    ctx.font = `${cs * 0.42}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText(`LEVEL ${rs.level}   LINES ${rs.lines}`, cx, H * 0.31);

    // Time
    const mm = String(Math.floor(rs.elapsedTime / 60000)).padStart(2, '0');
    const ss = String(Math.floor((rs.elapsedTime % 60000) / 1000)).padStart(2, '0');
    ctx.fillText(`TIME  ${mm}:${ss}`, cx, H * 0.37);

    // High scores table
    const scores = rs.highScores || [];
    const tableY = H * 0.44;
    ctx.font = `bold ${cs * 0.5}px monospace`;
    ctx.fillStyle = theme.textGlow;
    ctx.fillText('— HIGH SCORES —', cx, tableY);

    for (let i = 0; i < Math.min(5, scores.length); i++) {
      const s = scores[i];
      const y = tableY + (i + 1) * cs * 0.85;
      const isNew = i === 0 && s.score === rs.score;
      ctx.font = `${isNew ? 'bold ' : ''}${cs * 0.45}px monospace`;
      ctx.fillStyle = isNew ? theme.accentColor : theme.textColor;
      const timeStr = s.time
        ? `${String(Math.floor(s.time/60000)).padStart(2,'0')}:${String(Math.floor((s.time%60000)/1000)).padStart(2,'0')}`
        : '--:--';
      ctx.fillText(
        `${i+1}. ${String(s.score).padStart(8,'0')}  L${s.level}  ${timeStr}`,
        cx, y
      );
    }
    if (scores.length === 0) {
      ctx.font = `${cs * 0.42}px monospace`;
      ctx.fillStyle = theme.textGlow;
      ctx.fillText('No scores yet', cx, tableY + cs * 0.85);
    }

    // Restart prompt — pulsing
    const pulse = 0.6 + 0.4 * Math.sin(this._startPulse);
    ctx.globalAlpha = pulse;
    ctx.font = `bold ${cs * 0.6}px monospace`;
    ctx.fillStyle = theme.textColor;
    ctx.shadowColor = theme.textGlow;
    ctx.shadowBlur = 8;
    ctx.fillText('PRESS SPACE TO RESTART', cx, H * 0.92);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
