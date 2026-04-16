// ============================================================
// GAME STATE — Core gameplay logic, fully decoupled from rendering.
// Owns: Board, Piece, BagRandomizer, hold, scoring, timing.
// update(dt) advances all state and returns an events array.
// ============================================================

const HIGH_SCORE_KEY = 'yc_blocks_sf_highscores';
const NEXT_QUEUE_SIZE = 5;

class GameState {
  constructor() {
    this.board = new Board();
    this.bag = new BagRandomizer();
    this._initState();
  }

  _initState() {
    this.board.reset();
    this.bag.reset();

    this.currentPiece = null;
    this.holdPiece = null;
    this.holdUsed = false;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;          // -1 = no active combo
    this.backToBack = false;

    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;

    this.gravityAccumulator = 0;
    this.lockDelayTimer = 0;
    this.lockResets = 0;
    this.isOnSurface = false;

    this.clearingRows = [];
    this.clearAnimTimer = 0;

    this.elapsedTime = 0;
    this.phase = 'start';  // 'start' | 'playing' | 'lineclear' | 'paused' | 'gameover'
    this._prePausePhase = 'playing';

    this.highScores = this._loadHighScores();
  }

  // ── Public lifecycle ──────────────────────────────────────

  startGame() {
    this._initState();
    this.phase = 'playing';
    this._spawnPiece();
  }

  pause() {
    if (this.phase === 'playing' || this.phase === 'lineclear') {
      this._prePausePhase = this.phase;
      this.phase = 'paused';
    } else if (this.phase === 'paused') {
      this.phase = this._prePausePhase || 'playing';
    }
  }

  // ── Main tick ─────────────────────────────────────────────

  // Returns array of event objects: { type, label?, rows?, score? }
  update(dt) {
    const events = [];

    if (this.phase === 'lineclear') {
      this.elapsedTime += dt;
      this.clearAnimTimer += dt;
      if (this.clearAnimTimer >= LINE_CLEAR_ANIM_MS) {
        this._finishLineClear(events);
      }
      return events;
    }

    if (this.phase !== 'playing') return events;

    this.elapsedTime += dt;

    // Gravity
    this.gravityAccumulator += dt;
    const interval = getGravity(this.level);
    while (this.gravityAccumulator >= interval) {
      this.gravityAccumulator -= interval;
      if (!this._tryMoveDown()) {
        this.gravityAccumulator = 0;
        break;
      }
    }

    // Lock delay
    if (this.isOnSurface) {
      this.lockDelayTimer += dt;
      if (this.lockDelayTimer >= LOCK_DELAY) {
        this._lockPiece(events);
      }
    }

    return events;
  }

  // ── Player actions ────────────────────────────────────────

  moveLeft() {
    if (!this._canAct()) return false;
    const moved = this.currentPiece.tryMove(-1, 0, this.board);
    if (moved) {
      this.currentPiece = moved;
      this.lastMoveWasRotation = false;
      this._checkSurface();
      this._resetLockDelay();
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this._canAct()) return false;
    const moved = this.currentPiece.tryMove(1, 0, this.board);
    if (moved) {
      this.currentPiece = moved;
      this.lastMoveWasRotation = false;
      this._checkSurface();
      this._resetLockDelay();
      return true;
    }
    return false;
  }

  softDrop() {
    if (!this._canAct()) return false;
    if (this._tryMoveDown()) {
      this.score += SCORE_TABLE.soft_drop;
      this.gravityAccumulator = 0;
      return true;
    }
    return false;
  }

  hardDrop() {
    if (!this._canAct()) return [];
    const ghostRow = this.currentPiece.getGhostRow(this.board);
    const dropped = ghostRow - this.currentPiece.row;
    this.score += dropped * SCORE_TABLE.hard_drop;
    this.currentPiece = new Piece(
      this.currentPiece.type, ghostRow, this.currentPiece.col, this.currentPiece.rotation
    );
    this.isOnSurface = true;
    this.lockDelayTimer = LOCK_DELAY; // force immediate lock
    const events = [];
    this._lockPiece(events);
    return events;
  }

  rotateCW() {
    return this._rotate(1);
  }

  rotateCCW() {
    return this._rotate(-1);
  }

  hold() {
    if (!this._canAct() || this.holdUsed) return false;
    const heldType = this.holdPiece;
    this.holdPiece = this.currentPiece.type;
    this.holdUsed = true;
    if (heldType) {
      this.currentPiece = new Piece(heldType);
    } else {
      this._spawnPiece();
      this.holdUsed = true; // _spawnPiece resets holdUsed; restore it for the hold-lock
      return true;
    }
    this._checkSurface();
    this.lockDelayTimer = 0;
    this.lockResets = 0;
    this.gravityAccumulator = 0;
    return true;
  }

  // ── Computed state for rendering ──────────────────────────

  toRenderState() {
    const ghostRow = this.currentPiece
      ? this.currentPiece.getGhostRow(this.board)
      : null;

    return {
      grid: this.board.cloneGrid(),
      currentPiece: this.currentPiece ? {
        type: this.currentPiece.type,
        cells: this.currentPiece.getCells(),
        ghostCells: this.currentPiece.getCellsAtRow(ghostRow),
      } : null,
      holdPiece: this.holdPiece,
      holdUsed: this.holdUsed,
      nextQueue: this.bag.peek(NEXT_QUEUE_SIZE),
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      backToBack: this.backToBack,
      elapsedTime: this.elapsedTime,
      phase: this.phase,
      clearingRows: [...this.clearingRows],
      clearAnimProgress: this.clearingRows.length > 0
        ? Math.min(this.clearAnimTimer / LINE_CLEAR_ANIM_MS, 1)
        : 0,
      highScores: this.highScores,
    };
  }

  // ── Private helpers ───────────────────────────────────────

  _canAct() {
    return this.phase === 'playing' && this.currentPiece !== null;
  }

  _rotate(dir) {
    if (!this._canAct()) return false;
    const result = this.currentPiece.tryRotate(dir, this.board);
    if (result) {
      this.currentPiece = result.piece;
      this.lastMoveWasRotation = true;
      this.lastKickIndex = result.kickIndex;
      this._checkSurface();
      this._resetLockDelay();
      return true;
    }
    return false;
  }

  _tryMoveDown() {
    const moved = this.currentPiece.tryMove(0, 1, this.board);
    if (moved) {
      this.currentPiece = moved;
      this.isOnSurface = false;
      this.lockDelayTimer = 0;
      return true;
    }
    this.isOnSurface = true;
    return false;
  }

  _checkSurface() {
    const canMoveDown = this.currentPiece.tryMove(0, 1, this.board) !== null;
    this.isOnSurface = !canMoveDown;
  }

  _resetLockDelay() {
    if (this.isOnSurface && this.lockResets < MAX_LOCK_RESETS) {
      this.lockDelayTimer = 0;
      this.lockResets++;
    }
  }

  _spawnPiece() {
    const type = this.bag.next();
    this.currentPiece = new Piece(type);
    this.holdUsed = false;
    this.lastMoveWasRotation = false;
    this.lastKickIndex = 0;
    this.isOnSurface = false;
    this.lockDelayTimer = 0;
    this.lockResets = 0;
    this.gravityAccumulator = 0;

    // Block-out: if spawn position is occupied, game over
    if (!this.board.isValid(this.currentPiece.getCells())) {
      this.phase = 'gameover';
      this._saveHighScore();
      this.currentPiece = null;
    }
  }

  _lockPiece(events) {
    if (!this.currentPiece) return;

    const cells = this.currentPiece.getCells();
    const pieceType = this.currentPiece.type;

    // Detect T-spin BEFORE placing (needs current piece position)
    const tSpinType = this._detectTSpin();

    this.board.place(cells, pieceType);
    events.push({ type: 'piece_locked' });

    const filledRows = this.board.getFilledRows();

    if (filledRows.length > 0) {
      // Score the clear
      const scoreData = this._scoreClear(filledRows.length, tSpinType);
      this.score += scoreData.points;
      events.push({
        type: scoreData.eventType,
        label: scoreData.label,
        score: scoreData.points,
        rows: filledRows,
      });

      if (this.combo >= 0) {
        const comboBonus = SCORE_TABLE.combo * (this.combo + 1) * this.level;
        this.score += comboBonus;
        if (this.combo > 0) {
          events.push({ type: 'combo', label: `COMBO ×${this.combo + 1}!`, score: comboBonus });
        }
      }
      this.combo++;

      // Track back-to-back
      const isBtbWorthy = tSpinType !== null || filledRows.length === 4;
      this.backToBack = isBtbWorthy;

      // Enter line-clear animation phase
      this.clearingRows = filledRows;
      this.clearAnimTimer = 0;
      this.phase = 'lineclear';
    } else {
      // No lines cleared — reset combo
      this.combo = -1;

      if (tSpinType) {
        const scoreData = this._scoreClear(0, tSpinType);
        this.score += scoreData.points;
        events.push({ type: scoreData.eventType, label: scoreData.label, score: scoreData.points });
      }

      this._spawnPiece();
      if (this.phase === 'gameover') events.push({ type: 'gameover' });
    }

    this.currentPiece = this.phase === 'lineclear' ? null : this.currentPiece;
  }

  _finishLineClear(events) {
    this.board.clearRows(this.clearingRows);

    const prevLevel = this.level;
    this.lines += this.clearingRows.length;
    this.level = Math.floor(this.lines / 10) + 1;

    if (this.level > prevLevel) {
      events.push({ type: 'levelup', level: this.level });
    }

    events.push({ type: 'lines_cleared', count: this.clearingRows.length, rows: this.clearingRows });

    this.clearingRows = [];
    this.clearAnimTimer = 0;
    this.phase = 'playing';
    this._spawnPiece();
    if (this.phase === 'gameover') events.push({ type: 'gameover' });
  }

  // ── T-spin detection ──────────────────────────────────────

  // Returns: 'full' | 'mini' | null
  _detectTSpin() {
    if (this.currentPiece.type !== 'T') return null;
    if (!this.lastMoveWasRotation) return null;

    // T bounding box is 3×3. The center cell is at offset [1,1] from box top-left.
    const centerRow = this.currentPiece.row + 1;
    const centerCol = this.currentPiece.col + 1;

    // Check 4 diagonal corners of the center cell
    const corners = [
      this.board.isOccupied(centerRow - 1, centerCol - 1), // top-left
      this.board.isOccupied(centerRow - 1, centerCol + 1), // top-right
      this.board.isOccupied(centerRow + 1, centerCol - 1), // bottom-left
      this.board.isOccupied(centerRow + 1, centerCol + 1), // bottom-right
    ];

    const filledCount = corners.filter(Boolean).length;
    if (filledCount < 3) return null;

    // Determine which two corners are "front" (pointing direction of T's head)
    // rotation 0=facing up, 1=facing right, 2=facing down, 3=facing left
    const rot = this.currentPiece.rotation;
    // Front corners by rotation:
    // 0 (up):    top-left[0], top-right[1]
    // 1 (right): top-right[1], bottom-right[3]
    // 2 (down):  bottom-left[2], bottom-right[3]
    // 3 (left):  top-left[0], bottom-left[2]
    const frontPairs = [[0,1],[1,3],[2,3],[0,2]];
    const [fa, fb] = frontPairs[rot];

    const bothFrontFilled = corners[fa] && corners[fb];

    // Kick test 5 (index 4) always upgrades to full T-spin
    if (this.lastKickIndex === 4) return 'full';

    return bothFrontFilled ? 'full' : 'mini';
  }

  // ── Scoring ───────────────────────────────────────────────

  _scoreClear(lineCount, tSpinType) {
    let baseKey;
    let label;
    let isBtbEligible = false;

    if (tSpinType === 'full') {
      const keys = ['tspin_zero','tspin_single','tspin_double','tspin_triple'];
      const labels = ['T-SPIN!','T-SPIN SINGLE!','T-SPIN DOUBLE!','T-SPIN TRIPLE!'];
      baseKey = keys[lineCount] || 'tspin_triple';
      label = labels[lineCount] || 'T-SPIN TRIPLE!';
      isBtbEligible = lineCount > 0;
    } else if (tSpinType === 'mini') {
      const keys = ['tspin_mini_zero','tspin_mini_single','tspin_mini_double'];
      const labels = ['T-SPIN MINI!','T-SPIN MINI SINGLE!','T-SPIN MINI DOUBLE!'];
      baseKey = keys[lineCount] || 'tspin_mini_double';
      label = labels[lineCount] || 'T-SPIN MINI DOUBLE!';
      isBtbEligible = false; // minis don't extend B2B
    } else {
      const keys = [null,'single','double','triple','yc_blocks'];
      const labels = ['','SINGLE','DOUBLE','TRIPLE','YC-BLOCKS!'];
      baseKey = keys[lineCount];
      label = labels[lineCount] || '';
      isBtbEligible = lineCount === 4;
    }

    let base = baseKey ? (SCORE_TABLE[baseKey] || 0) : 0;
    base *= this.level;

    // Back-to-back bonus
    if (isBtbEligible && this.backToBack) {
      base = Math.floor(base * BACK_TO_BACK_MULTIPLIER);
      label = 'BACK-TO-BACK ' + label;
    }

    return { points: base, eventType: baseKey || 'lines_cleared', label };
  }

  // ── High scores (localStorage) ────────────────────────────

  _loadHighScores() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  _saveHighScore() {
    try {
      if (typeof localStorage === 'undefined') return;
      const entry = {
        score: this.score,
        lines: this.lines,
        level: this.level,
        time: this.elapsedTime,
        date: new Date().toLocaleDateString(),
      };
      this.highScores.push(entry);
      this.highScores.sort((a, b) => b.score - a.score);
      this.highScores = this.highScores.slice(0, 5);
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(this.highScores));
    } catch { /* ignore storage errors */ }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameState };
}
