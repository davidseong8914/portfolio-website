// ============================================================
// INPUT HANDLER — keyboard (with DAS/ARR) + touch gestures
// Returns an array of action strings each frame via update(dt).
// ============================================================

const KEY_MAP = {
  'ArrowLeft':  'moveLeft',
  'ArrowRight': 'moveRight',
  'ArrowDown':  'softDrop',
  'ArrowUp':    'rotateCW',
  'KeyZ':       'rotateCCW',
  'Space':      'hardDrop',
  'ShiftLeft':  'hold',
  'ShiftRight': 'hold',
  'KeyC':       'hold',
  'Escape':     'pause',
  'KeyP':       'pause',
};

// Actions that repeat with DAS/ARR when held
const DAS_ACTIONS = new Set(['moveLeft', 'moveRight', 'softDrop']);

class InputHandler {
  constructor(canvas) {
    this._canvas = canvas;
    this._keysDown = new Set();       // currently held key codes
    this._dasAction = null;           // which DAS action is active
    this._dasTimer = 0;
    this._dasCharged = false;         // has DAS initial delay elapsed?
    this._arrTimer = 0;
    this._pendingActions = [];        // actions to emit this frame

    // Touch state
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchStartTime = 0;
    this._touchMoved = false;
    this._longPressTimer = null;
    this._lastSwipeDir = null;
    this._swipeRepeatTimer = 0;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
  }

  // ── Main per-frame update ─────────────────────────────────

  update(dt) {
    const actions = [...this._pendingActions];
    this._pendingActions = [];

    // DAS / ARR processing
    if (this._dasAction) {
      if (!this._dasCharged) {
        this._dasTimer += dt;
        if (this._dasTimer >= DAS_DELAY) {
          this._dasCharged = true;
          this._arrTimer = 0;
        }
      } else {
        this._arrTimer += dt;
        while (this._arrTimer >= ARR_DELAY) {
          this._arrTimer -= ARR_DELAY;
          actions.push(this._dasAction);
        }
      }
    }

    return actions;
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this._canvas.removeEventListener('touchstart', this._onTouchStart);
    this._canvas.removeEventListener('touchmove', this._onTouchMove);
    this._canvas.removeEventListener('touchend', this._onTouchEnd);
    if (this._longPressTimer) clearTimeout(this._longPressTimer);
  }

  // ── Keyboard ──────────────────────────────────────────────

  _onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;

    // Prevent browser scroll on game keys
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (this._keysDown.has(e.code)) return; // already held (auto-repeat from browser)
    this._keysDown.add(e.code);

    // Emit action immediately
    this._pendingActions.push(action);

    // Start DAS for repeatable actions
    if (DAS_ACTIONS.has(action)) {
      this._dasAction = action;
      this._dasTimer = 0;
      this._dasCharged = false;
      this._arrTimer = 0;
    }
  }

  _onKeyUp(e) {
    const action = KEY_MAP[e.code];
    this._keysDown.delete(e.code);

    if (action && DAS_ACTIONS.has(action)) {
      // If the released key was driving DAS, stop or switch to another held DAS key
      if (this._dasAction === action) {
        // Check if the opposite direction is still held
        const held = this._getHeldDasAction();
        if (held) {
          this._dasAction = held;
          this._dasTimer = 0;
          this._dasCharged = false;
          this._arrTimer = 0;
        } else {
          this._dasAction = null;
        }
      }
    }
  }

  _getHeldDasAction() {
    for (const [code, action] of Object.entries(KEY_MAP)) {
      if (DAS_ACTIONS.has(action) && this._keysDown.has(code)) return action;
    }
    return null;
  }

  // ── Touch ─────────────────────────────────────────────────

  _onTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    this._touchStartX = t.clientX;
    this._touchStartY = t.clientY;
    this._touchStartTime = Date.now();
    this._touchMoved = false;
    this._lastSwipeDir = null;

    // Long press → hold
    this._longPressTimer = setTimeout(() => {
      if (!this._touchMoved) {
        this._pendingActions.push('hold');
        this._longPressTimer = null;
      }
    }, 300);
  }

  _onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - this._touchStartX;
    const dy = t.clientY - this._touchStartY;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      this._touchMoved = true;
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
    }

    // Continuous soft drop via downward drag
    if (dy > 30 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      this._pendingActions.push('softDrop');
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - this._touchStartX;
    const dy = t.clientY - this._touchStartY;
    const elapsed = Date.now() - this._touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!this._touchMoved && elapsed < 200 && absDx < 15 && absDy < 15) {
      // Short tap → rotate CW
      this._pendingActions.push('rotateCW');
      return;
    }

    if (absDy > 60 && absDy > absDx * 1.5) {
      if (dy < 0) {
        // Swipe up → rotate CW
        this._pendingActions.push('rotateCW');
      } else {
        // Fast swipe down → hard drop
        this._pendingActions.push('hardDrop');
      }
      return;
    }

    if (absDx > 30 && absDx > absDy * 1.5) {
      // Horizontal swipe — move proportional to distance
      const dir = dx > 0 ? 'moveRight' : 'moveLeft';
      const steps = Math.max(1, Math.floor(absDx / 30));
      for (let i = 0; i < steps; i++) {
        this._pendingActions.push(dir);
      }
    }
  }
}
