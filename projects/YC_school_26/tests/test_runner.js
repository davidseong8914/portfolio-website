// ============================================================
// TEST RUNNER — zero-dependency, Node.js only
// Usage: node tests/test_runner.js  (run from YC_school_26/)
// ============================================================

// Load game modules (Node.js CommonJS)
const path = require('path');
const base = path.join(__dirname, '../game_algorithm');

const C = require(path.join(base, 'constants.js'));
// Inject constants into global scope so classes can reference them
Object.assign(global, C);

const { Board }          = require(path.join(base, 'board.js'));
const { Piece }          = require(path.join(base, 'piece.js'));
const { BagRandomizer, PIECE_TYPES, PIECE_WEIGHTS } = require(path.join(base, 'bag_randomizer.js'));
const { GameState }      = require(path.join(base, 'game_state.js'));

// Make classes globally available (game_state instantiates them directly)
global.Board = Board;
global.Piece = Piece;
global.BagRandomizer = BagRandomizer;
global.PIECE_TYPES = PIECE_TYPES;
global.PIECE_WEIGHTS = PIECE_WEIGHTS;

// ── Assertion helpers ─────────────────────────────────────

let _passed = 0;
let _failed = 0;
let _currentSuite = '';

function assert(condition, message) {
  if (condition) {
    _passed++;
  } else {
    _failed++;
    console.error(`  ✗ FAIL [${_currentSuite}]: ${message}`);
  }
}

function assertEqual(a, b, message) {
  const eq = JSON.stringify(a) === JSON.stringify(b);
  if (eq) {
    _passed++;
  } else {
    _failed++;
    console.error(`  ✗ FAIL [${_currentSuite}]: ${message}`);
    console.error(`    expected: ${JSON.stringify(b)}`);
    console.error(`    got:      ${JSON.stringify(a)}`);
  }
}

function assertDeepEqual(a, b, message) {
  assertEqual(a, b, message);
}

// ── Suite runner ──────────────────────────────────────────

const _suites = [];

function suite(name, fn) {
  _suites.push({ name, fn });
}

function runAll() {
  for (const s of _suites) {
    _currentSuite = s.name;
    console.log(`\n▸ ${s.name}`);
    try {
      s.fn({ assert, assertEqual, assertDeepEqual, Board, Piece, BagRandomizer, GameState, PIECE_TYPES, PIECE_WEIGHTS });
    } catch (e) {
      _failed++;
      console.error(`  ✗ UNCAUGHT ERROR: ${e.message}`);
      console.error(e.stack);
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  if (_failed === 0) {
    console.log(`✓ All ${_passed} tests passed`);
    process.exit(0);
  } else {
    console.log(`✗ ${_failed} failed, ${_passed} passed`);
    process.exit(1);
  }
}

// Load test files
require('./test_bag_randomizer.js')({ suite });
require('./test_board.js')({ suite });
require('./test_piece.js')({ suite });
require('./test_game_state.js')({ suite });

runAll();
