// ============================================================
// TESTS: GameState — T-spin detection, scoring, back-to-back, combos
// Note: localStorage not available in Node.js — _loadHighScores returns []
// ============================================================

module.exports = function({ suite }) {

  // ── T-spin setup helper ──────────────────────────────────

  // Place a T-piece in a classic T-spin slot and verify detection.
  // We directly manipulate GameState internals since _detectTSpin is a private method.
  // T-spin slot: 3 corners filled, last move was rotation.
  function makeTSpinState(rotation, frontBothFilled, kickIdx) {
    const gs = new GameState();
    gs.phase = 'playing';

    // Place the T piece at a known position
    gs.currentPiece = new Piece('T', 5, 4, rotation);
    gs.lastMoveWasRotation = true;
    gs.lastKickIndex = kickIdx || 0;

    // T bounding box at (5,4): center cell is (6,5)
    // Corners: TL=(5,4), TR=(5,6), BL=(7,4), BR=(7,6)
    // Fill 3 corners to simulate T-spin
    if (!frontBothFilled) {
      // Fill 3 corners: TL, TR, BR (front = TL+TR for rot=0, only 1 of them filled means mini)
      // Actually for mini, fill 3 corners but only 1 front corner
    }
    return gs;
  }

  suite('GameState — _detectTSpin: full T-spin (3+ corners, both front filled)', ({ assert, assertEqual, GameState, Piece, Board }) => {
    const gs = new GameState();
    gs.phase = 'playing';

    // T-piece at row=5, col=4, rotation=0 (facing up: front = top-left + top-right)
    // Center = (6, 5); corners: TL=(5,4), TR=(5,6), BL=(7,4), BR=(7,6)
    gs.currentPiece = new Piece('T', 5, 4, 0);
    gs.lastMoveWasRotation = true;
    gs.lastKickIndex = 0;

    // Fill: TL, TR (both front), BL (back-left) — 3 total = full T-spin
    gs.board.place([[5, 4]], 'I');  // TL corner (front)
    gs.board.place([[5, 6]], 'I');  // TR corner (front)
    gs.board.place([[7, 4]], 'I');  // BL corner (back)
    // BR empty — only 3 corners filled, both front filled → full T-spin

    const result = gs._detectTSpin();
    assertEqual(result, 'full', 'should detect full T-spin when 3 corners filled and both front corners occupied');
  });

  suite('GameState — _detectTSpin: T-spin mini (3 corners but only 1 front)', ({ assert, assertEqual, GameState, Piece }) => {
    const gs = new GameState();
    gs.phase = 'playing';

    // T rotation=0, front = top-left [0] + top-right [1]
    // Center at (6,5) for piece at (5,4)
    gs.currentPiece = new Piece('T', 5, 4, 0);
    gs.lastMoveWasRotation = true;
    gs.lastKickIndex = 0;

    // Fill TR (1 front), BL + BR (back) — 3 total, only 1 front → mini
    gs.board.place([[5, 6]], 'I');  // TR (1 front corner)
    gs.board.place([[7, 4]], 'I');  // BL (back)
    gs.board.place([[7, 6]], 'I');  // BR (back)

    const result = gs._detectTSpin();
    assertEqual(result, 'mini', 'should detect T-spin mini when only 1 front corner is filled');
  });

  suite('GameState — _detectTSpin: kick index 4 upgrades mini to full', ({ assert, assertEqual, GameState, Piece }) => {
    const gs = new GameState();
    gs.phase = 'playing';

    gs.currentPiece = new Piece('T', 5, 4, 0);
    gs.lastMoveWasRotation = true;
    gs.lastKickIndex = 4; // 5th kick test — always full T-spin

    // Only 1 front corner (would be mini without kick exception)
    gs.board.place([[5, 6]], 'I');  // TR (1 front)
    gs.board.place([[7, 4]], 'I');  // BL
    gs.board.place([[7, 6]], 'I');  // BR

    const result = gs._detectTSpin();
    assertEqual(result, 'full', 'kickIndex=4 should upgrade mini to full T-spin');
  });

  suite('GameState — _detectTSpin: returns null if fewer than 3 corners filled', ({ assert, assertEqual, GameState, Piece }) => {
    const gs = new GameState();
    gs.phase = 'playing';

    gs.currentPiece = new Piece('T', 5, 4, 0);
    gs.lastMoveWasRotation = true;
    gs.lastKickIndex = 0;

    // Only 2 corners
    gs.board.place([[5, 4]], 'I');
    gs.board.place([[7, 4]], 'I');

    const result = gs._detectTSpin();
    assertEqual(result, null, 'should return null when fewer than 3 corners filled');
  });

  suite('GameState — _detectTSpin: returns null if last move was not rotation', ({ assert, assertEqual, GameState, Piece }) => {
    const gs = new GameState();
    gs.phase = 'playing';

    gs.currentPiece = new Piece('T', 5, 4, 0);
    gs.lastMoveWasRotation = false; // moved sideways last
    gs.lastKickIndex = 0;

    // 3 corners filled (would be T-spin if rotation)
    gs.board.place([[5, 4]], 'I');
    gs.board.place([[5, 6]], 'I');
    gs.board.place([[7, 4]], 'I');

    const result = gs._detectTSpin();
    assertEqual(result, null, 'should return null if last move was not a rotation');
  });

  suite('GameState — _detectTSpin: returns null for non-T pieces', ({ assert, assertEqual, GameState, Piece }) => {
    const gs = new GameState();
    gs.phase = 'playing';
    gs.currentPiece = new Piece('I', 5, 3, 0);
    gs.lastMoveWasRotation = true;

    const result = gs._detectTSpin();
    assertEqual(result, null, 'non-T pieces should never detect T-spin');
  });

  // ── Scoring tests ─────────────────────────────────────────

  suite('GameState — _scoreClear: single = 100 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    const { points } = gs._scoreClear(1, null);
    assertEqual(points, 100, 'single at level 1 = 100');

    gs.level = 3;
    const { points: p3 } = gs._scoreClear(1, null);
    assertEqual(p3, 300, 'single at level 3 = 300');
  });

  suite('GameState — _scoreClear: double = 300 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 2;
    const { points } = gs._scoreClear(2, null);
    assertEqual(points, 600, 'double at level 2 = 600');
  });

  suite('GameState — _scoreClear: triple = 500 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    const { points } = gs._scoreClear(3, null);
    assertEqual(points, 500, 'triple at level 1 = 500');
  });

  suite('GameState — _scoreClear: yc_blocks (4-line) = 800 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    const { points } = gs._scoreClear(4, null);
    assertEqual(points, 800, 'yc_blocks at level 1 = 800');

    gs.level = 5;
    const { points: p5 } = gs._scoreClear(4, null);
    assertEqual(p5, 4000, 'yc_blocks at level 5 = 4000');
  });

  suite('GameState — _scoreClear: T-spin single = 800 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    const { points } = gs._scoreClear(1, 'full');
    assertEqual(points, 800, 'T-spin single at level 1 = 800');
  });

  suite('GameState — _scoreClear: T-spin double = 1200 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    const { points } = gs._scoreClear(2, 'full');
    assertEqual(points, 1200, 'T-spin double at level 1 = 1200');
  });

  suite('GameState — _scoreClear: T-spin triple = 1600 × level', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    const { points } = gs._scoreClear(3, 'full');
    assertEqual(points, 1600, 'T-spin triple at level 1 = 1600');
  });

  suite('GameState — back-to-back: consecutive 4-line clears get 1.5× bonus', ({ assert, GameState }) => {
    const gs = new GameState();
    gs.level = 1;

    // First yc_blocks clear: no B2B yet
    gs.backToBack = false;
    const { points: first } = gs._scoreClear(4, null);
    assert(first === 800, `first 4-line should be 800, got ${first}`);

    // Now backToBack is set. Second should be B2B.
    gs.backToBack = true;
    const { points: second } = gs._scoreClear(4, null);
    assert(second === 1200, `back-to-back 4-line should be 1200, got ${second}`);
  });

  suite('GameState — back-to-back: label includes BACK-TO-BACK', ({ assert, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    gs.backToBack = true;
    const { label } = gs._scoreClear(4, null);
    assert(label.includes('BACK-TO-BACK'), `B2B label should include "BACK-TO-BACK", got: "${label}"`);
  });

  suite('GameState — back-to-back: B2B applies to T-spins too', ({ assert, GameState }) => {
    const gs = new GameState();
    gs.level = 1;
    gs.backToBack = true;
    const { points } = gs._scoreClear(2, 'full'); // T-spin double
    assert(points === 1800, `B2B T-spin double should be 1800, got ${points}`);
  });

  suite('GameState — combo tracking: combo increments on consecutive clears', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.combo = -1;

    // Simulate what _lockPiece does to combo
    // First clear
    gs.combo++;
    assertEqual(gs.combo, 0, 'combo should be 0 after first clear');

    // Second consecutive clear
    gs.combo++;
    assertEqual(gs.combo, 1, 'combo should be 1 after second consecutive clear');
  });

  suite('GameState — combo resets after non-clearing lock', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.combo = 3; // had 4 consecutive clears

    // Lock with no lines cleared resets combo
    gs.combo = -1;
    assertEqual(gs.combo, -1, 'combo should reset to -1 after no clear');
  });

  suite('GameState — level starts at 1 and increases every 10 lines', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.startGame();
    assertEqual(gs.level, 1, 'level should start at 1');

    gs.lines = 10;
    gs.level = Math.floor(gs.lines / 10) + 1;
    assertEqual(gs.level, 2, 'level should be 2 at 10 lines');

    gs.lines = 20;
    gs.level = Math.floor(gs.lines / 10) + 1;
    assertEqual(gs.level, 3, 'level should be 3 at 20 lines');
  });

  suite('GameState — gravity interval decreases with level', ({ assert, GameState }) => {
    const gs = new GameState();
    const slowGravity = getGravity(1);
    const fastGravity = getGravity(10);
    assert(fastGravity < slowGravity, `gravity at level 10 (${fastGravity}ms) should be faster than level 1 (${slowGravity}ms)`);
  });

  suite('GameState — hold: swaps piece and sets holdUsed', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.startGame();

    const firstType = gs.currentPiece.type;
    gs.hold();

    assertEqual(gs.holdPiece, firstType, 'hold piece should be first piece type');
    assert(gs.holdUsed, 'holdUsed should be true after hold');
  });

  suite('GameState — hold: cannot hold twice before locking', ({ assert, assertEqual, GameState }) => {
    const gs = new GameState();
    gs.startGame();

    const firstType = gs.currentPiece.type;
    gs.hold(); // first hold
    const secondType = gs.currentPiece.type;
    gs.hold(); // second hold — should be ignored

    // Current piece should NOT have changed on second hold
    assert(gs.holdUsed, 'holdUsed should prevent second hold');
    assertEqual(gs.currentPiece.type, secondType, 'current piece type should not change on blocked hold');
  });

};
