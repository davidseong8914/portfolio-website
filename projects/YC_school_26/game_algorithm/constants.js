// ============================================================
// TETRIS GUIDELINE CONSTANTS
// All timing in milliseconds. Coordinate system: row 0 = top.
// SRS kick tables use Y-up convention (per spec); negate dy when applying.
// ============================================================

const COLS = 10;
const ROWS = 20;
const HIDDEN_ROWS = 2;
const TOTAL_ROWS = ROWS + HIDDEN_ROWS; // 22

const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;
const DAS_DELAY = 167;
const ARR_DELAY = 33;
const LINE_CLEAR_ANIM_MS = 400;
const SPAWN_COL = 3; // left col of spawn bounding box

// ============================================================
// GRAVITY TABLE — ms per row drop, indexed by level (0-based)
// ============================================================
const GRAVITY_TABLE = [
  800,  // 0
  717,  // 1
  633,  // 2
  550,  // 3
  467,  // 4
  383,  // 5
  300,  // 6
  217,  // 7
  133,  // 8
  100,  // 9
  83,   // 10
  67,   // 11
  50,   // 12
  33,   // 13
  17,   // 14
  17,   // 15
  17,   // 16
  17,   // 17
  17,   // 18
  17,   // 19
  1,    // 20+ (20G)
];

function getGravity(level) {
  return GRAVITY_TABLE[Math.min(level, GRAVITY_TABLE.length - 1)];
}

// ============================================================
// SCORING TABLE
// ============================================================
const SCORE_TABLE = {
  single:           100,
  double:           300,
  triple:           500,
  yc_blocks:        800,
  tspin_zero:       400,
  tspin_single:     800,
  tspin_double:     1200,
  tspin_triple:     1600,
  tspin_mini_zero:  100,
  tspin_mini_single: 200,
  tspin_mini_double: 400,
  soft_drop:        1,   // per cell
  hard_drop:        2,   // per cell
  combo:            50,  // × combo_count × level
};

const BACK_TO_BACK_MULTIPLIER = 1.5;

// ============================================================
// PIECE SHAPES
// Each piece has 4 rotation states (0, R=1, 2, L=3).
// Each state is an array of [row, col] offsets from bounding box top-left.
// Bounding boxes:
//   I: 4×4   O: 4×4   T/S/Z/L/J: 3×3
// ============================================================
const PIECE_SHAPES = {
  I: [
    // State 0
    [[1,0],[1,1],[1,2],[1,3]],
    // State R
    [[0,2],[1,2],[2,2],[3,2]],
    // State 2
    [[2,0],[2,1],[2,2],[2,3]],
    // State L
    [[0,1],[1,1],[2,1],[3,1]],
  ],
  O: [
    // All 4 states identical (no rotation effect)
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[1,2]],
  ],
  T: [
    // State 0:  .X.
    //           XXX
    [[0,1],[1,0],[1,1],[1,2]],
    // State R:  X.
    //           XX
    //           X.
    [[0,1],[1,1],[1,2],[2,1]],
    // State 2:  XXX
    //           .X.
    [[0,0],[0,1],[0,2],[1,1]],
    // State L:  .X
    //           XX
    //           .X
    [[0,1],[1,0],[1,1],[2,1]],
  ],
  S: [
    // State 0:  .XX
    //           XX.
    [[0,1],[0,2],[1,0],[1,1]],
    // State R:  X.
    //           XX
    //           .X
    [[0,0],[1,0],[1,1],[2,1]],
    // State 2
    [[0,1],[0,2],[1,0],[1,1]],
    // State L
    [[0,0],[1,0],[1,1],[2,1]],
  ],
  Z: [
    // State 0:  XX.
    //           .XX
    [[0,0],[0,1],[1,1],[1,2]],
    // State R:  .X
    //           XX
    //           X.
    [[0,1],[1,0],[1,1],[2,0]],
    // State 2
    [[0,0],[0,1],[1,1],[1,2]],
    // State L
    [[0,1],[1,0],[1,1],[2,0]],
  ],
  L: [
    // State 0:  ..X
    //           XXX
    [[0,2],[1,0],[1,1],[1,2]],
    // State R:  X.
    //           X.
    //           XX
    [[0,0],[1,0],[2,0],[2,1]],
    // State 2:  XXX
    //           X..
    [[0,0],[0,1],[0,2],[1,0]],
    // State L:  XX
    //           .X
    //           .X
    [[0,0],[0,1],[1,1],[2,1]],
  ],
  J: [
    // State 0:  X..
    //           XXX
    [[0,0],[1,0],[1,1],[1,2]],
    // State R:  XX
    //           X.
    //           X.
    [[0,0],[0,1],[1,0],[2,0]],
    // State 2:  XXX
    //           ..X
    [[0,0],[0,1],[0,2],[1,2]],
    // State L:  .X
    //           .X
    //           XX
    [[0,1],[1,1],[2,0],[2,1]],
  ],
  // ── Custom pieces ──────────────────────────────────────────
  // Y: single tile (YC logo block — all rotations identical)
  Y: [
    [[0,0]],
    [[0,0]],
    [[0,0]],
    [[0,0]],
  ],
  // B: SF Bridge — top beam + two towers
  //   State 0:  ■ ■ ■ ■     State R:  ■ ■
  //             ■ . . ■               . ■
  //                                   . ■
  //                                   ■ ■
  //   State 2:  ■ . . ■     State L:  ■ ■
  //             ■ ■ ■ ■               ■ .
  //                                   ■ .
  //                                   ■ ■
  B: [
    [[0,0],[0,1],[0,2],[0,3],[1,0],[1,3]],
    [[0,0],[0,1],[1,1],[2,1],[3,0],[3,1]],
    [[0,0],[0,3],[1,0],[1,1],[1,2],[1,3]],
    [[0,0],[0,1],[1,0],[2,0],[3,0],[3,1]],
  ],
};

// Spawn row for each piece (top of bounding box).
// Row 1 puts the bottom cells of 3x3 pieces at row 2 (first visible row),
// and the I-piece cells at row 2 (immediately visible). Matches Tetris Guideline.
const SPAWN_ROW = {
  I: 1,
  O: 1,
  T: 1,
  S: 1,
  Z: 1,
  L: 1,
  J: 1,
  Y: 1,
  B: 1,
};

// ============================================================
// SRS WALL KICK TABLES
// Key format: 'fromState>toState'  e.g. '0>R', 'R>2'
// State encoding: 0=0, R=1(encoded as 'R'), 2=2, L=3(encoded as 'L')
// Each value: array of 5 [dx, dy] offsets (Y-UP convention per SRS spec).
// When applying: col += dx, row -= dy  (negate dy for canvas row-down coords)
// ============================================================
const KICK_TABLE_JLSTZ = {
  '0>R': [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
  'R>0': [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
  'R>2': [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
  '2>R': [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
  '2>L': [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
  'L>2': [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
  'L>0': [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
  '0>L': [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
};

const KICK_TABLE_I = {
  '0>R': [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
  'R>0': [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
  'R>2': [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
  '2>R': [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  '2>L': [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
  'L>2': [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
  'L>0': [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  '0>L': [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
};

// Rotation state integer → key string
const ROT_KEYS = ['0', 'R', '2', 'L'];

function getKickTable(pieceType) {
  // B (bridge) shares the I-piece kick table — both transition between wide and tall states
  return (pieceType === 'I' || pieceType === 'B') ? KICK_TABLE_I : KICK_TABLE_JLSTZ;
}

function getKickKey(fromRot, toRot) {
  return `${ROT_KEYS[fromRot]}>${ROT_KEYS[toRot]}`;
}

// ============================================================
// PIECE COLOR PALETTES — per theme, per piece type
// Themes: 0=Golden Gate Fog, 1=Chinatown Neon, 2=Mission Murals
// ============================================================
const PIECE_COLORS_BY_THEME = [
  // Theme 0: Golden Gate Fog
  {
    I: '#FF6B35', O: '#FFB347', T: '#CC4400',
    S: '#FF8C42', Z: '#E63900', L: '#FFC87A', J: '#B33000',
    Y: '#F26522', B: '#CC1100',
  },
  // Theme 1: Chinatown Neon
  {
    I: '#00FFFF', O: '#FFD700', T: '#FF1493',
    S: '#00FF88', Z: '#FF6B9D', L: '#FFB3DE', J: '#9B59B6',
    Y: '#F26522', B: '#CC1100',
  },
  // Theme 2: Mission Murals
  {
    I: '#00E5FF', O: '#FFEA00', T: '#E040FB',
    S: '#76FF03', Z: '#FF6D00', L: '#FF4081', J: '#40C4FF',
    Y: '#F26522', B: '#CC1100',
  },
];

// Export for Node.js (unit tests) and browser (no-op if not in Node)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLS, ROWS, HIDDEN_ROWS, TOTAL_ROWS,
    LOCK_DELAY, MAX_LOCK_RESETS, DAS_DELAY, ARR_DELAY,
    LINE_CLEAR_ANIM_MS, SPAWN_COL, SPAWN_ROW,
    GRAVITY_TABLE, getGravity,
    SCORE_TABLE, BACK_TO_BACK_MULTIPLIER,
    PIECE_SHAPES, PIECE_COLORS_BY_THEME,
    KICK_TABLE_JLSTZ, KICK_TABLE_I,
    ROT_KEYS, getKickTable, getKickKey,
    PIECE_TYPES: ['I', 'O', 'T', 'S', 'Z', 'L', 'J', 'Y', 'B'],
  };
}
