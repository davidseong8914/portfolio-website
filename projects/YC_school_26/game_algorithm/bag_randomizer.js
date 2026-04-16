// ============================================================
// BAG RANDOMIZER — weighted random with guaranteed first piece
// Y (YC block) is always the very first piece every game.
// Subsequent draws use weighted probability:
//   Standard pieces (I O T S Z L J): weight 1.0 each
//   Y (YC tile):                     weight 0.5  (half as likely)
//   B (bridge):                      weight 0.2  (1/5 as likely)
// Queue stays >= 18 pieces ahead for smooth next-piece display.
// ============================================================

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J', 'Y', 'B'];

const PIECE_WEIGHTS = {
  I: 1, O: 1, T: 1, S: 1, Z: 1, L: 1, J: 1,
  Y: 0.5,
  B: 0.2,
};

const _WEIGHT_ENTRIES = Object.entries(PIECE_WEIGHTS);
const _TOTAL_WEIGHT = _WEIGHT_ENTRIES.reduce((sum, [, w]) => sum + w, 0);

function _weightedPick() {
  let r = Math.random() * _TOTAL_WEIGHT;
  for (const [type, weight] of _WEIGHT_ENTRIES) {
    r -= weight;
    if (r <= 0) return type;
  }
  return _WEIGHT_ENTRIES[_WEIGHT_ENTRIES.length - 1][0]; // fallback
}

class BagRandomizer {
  constructor() {
    this._queue = [];
    this._ensureQueue();
    this._setYFirst();
  }

  // Consume and return the next piece type
  next() {
    this._ensureQueue();
    return this._queue.shift();
  }

  // Peek at the next count pieces without consuming
  peek(count) {
    this._ensureQueue();
    return this._queue.slice(0, count);
  }

  reset() {
    this._queue = [];
    this._ensureQueue();
    this._setYFirst();
  }

  // ── Private ───────────────────────────────────────────────

  _ensureQueue() {
    while (this._queue.length < 18) {
      this._queue.push(_weightedPick());
    }
  }

  // Guarantee Y is the first piece: swap whatever is at index 0 with the
  // first Y found in the queue (or insert one if none exists yet).
  _setYFirst() {
    if (this._queue[0] === 'Y') return;
    const yIdx = this._queue.findIndex(t => t === 'Y');
    if (yIdx > 0) {
      // Swap first occurrence of Y to the front
      [this._queue[0], this._queue[yIdx]] = [this._queue[yIdx], this._queue[0]];
    } else {
      // No Y in queue yet — replace the first slot
      this._queue.unshift('Y');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BagRandomizer, PIECE_TYPES, PIECE_WEIGHTS };
}
