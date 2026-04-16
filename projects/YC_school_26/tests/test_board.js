// ============================================================
// TESTS: Board
// ============================================================

module.exports = function({ suite }) {

  suite('Board — isValid: empty board accepts in-bounds cells', ({ assert, Board }) => {
    const board = new Board();
    assert(board.isValid([[0,0]]), 'top-left corner should be valid');
    assert(board.isValid([[TOTAL_ROWS-1, COLS-1]]), 'bottom-right corner should be valid');
    assert(board.isValid([[10,5],[11,5]]), 'middle cells should be valid');
  });

  suite('Board — isValid: rejects out-of-bounds', ({ assert, Board }) => {
    const board = new Board();
    assert(!board.isValid([[-1, 0]]), 'row < 0 should be invalid');
    assert(!board.isValid([[TOTAL_ROWS, 0]]), 'row >= TOTAL_ROWS should be invalid');
    assert(!board.isValid([[0, -1]]), 'col < 0 should be invalid');
    assert(!board.isValid([[0, COLS]]), 'col >= COLS should be invalid');
  });

  suite('Board — isValid: rejects occupied cells', ({ assert, Board }) => {
    const board = new Board();
    board.place([[5, 3]], 'T');
    assert(!board.isValid([[5, 3]]), 'occupied cell should be invalid');
    assert(board.isValid([[5, 4]]), 'adjacent cell should still be valid');
  });

  suite('Board — getCell round-trips place()', ({ assert, assertEqual, Board }) => {
    const board = new Board();
    board.place([[10, 5]], 'I');
    assertEqual(board.getCell(10, 5), 'I', 'getCell should return placed piece type');
    assertEqual(board.getCell(10, 4), null, 'adjacent cell should be null');
    assertEqual(board.getCell(-1, 0), null, 'out-of-bounds getCell should return null');
  });

  suite('Board — getFilledRows: empty board has none', ({ assert, assertEqual, Board }) => {
    const board = new Board();
    assertEqual(board.getFilledRows(), [], 'empty board has no filled rows');
  });

  suite('Board — getFilledRows: correctly identifies full rows', ({ assert, assertEqual, Board }) => {
    const board = new Board();
    // Fill row 20 (last visible row, index 21 in total)
    for (let c = 0; c < COLS; c++) board.place([[21, c]], 'I');
    const filled = board.getFilledRows();
    assertEqual(filled, [21], 'row 21 should be detected as filled');

    // Partially fill row 20
    for (let c = 0; c < COLS - 1; c++) board.place([[20, c]], 'T');
    const filled2 = board.getFilledRows();
    assert(!filled2.includes(20), 'partial row 20 should NOT be in filled rows');
  });

  suite('Board — clearRows shifts rows down and inserts empty rows at top', ({ assert, assertEqual, Board }) => {
    const board = new Board();
    // Put a marker piece in row 10
    board.place([[10, 0]], 'L');
    // Fill row 15 completely
    for (let c = 0; c < COLS; c++) board.place([[15, c]], 'I');

    const filled = board.getFilledRows();
    assertEqual(filled, [15], 'row 15 should be filled before clear');

    board.clearRows(filled);

    // Row 10's marker should now be at row 11 (shifted down by 1)
    assertEqual(board.getCell(11, 0), 'L', 'marker in row 10 should shift to row 11');
    // Row 0 should now be empty (new row inserted at top)
    assertEqual(board.getCell(0, 0), null, 'new top row should be empty');
  });

  suite('Board — clearRows: multiple rows clear correctly', ({ assert, assertEqual, Board }) => {
    const board = new Board();
    // Fill rows 19 and 20 (indices 19 and 20 in TOTAL_ROWS=22)
    for (let c = 0; c < COLS; c++) {
      board.place([[19, c]], 'S');
      board.place([[20, c]], 'Z');
    }
    // Marker above the cleared rows
    board.place([[18, 0]], 'T');

    board.clearRows([19, 20]);

    // T should now be at row 20 (shifted down by 2)
    assertEqual(board.getCell(20, 0), 'T', 'marker should shift down by 2');
    // Top 2 rows should be empty
    assertEqual(board.getCell(0, 0), null, 'row 0 should be empty');
    assertEqual(board.getCell(1, 0), null, 'row 1 should be empty');
  });

  suite('Board — isOccupied returns true for walls/floor', ({ assert, Board }) => {
    const board = new Board();
    assert(board.isOccupied(-1, 0), 'above board should be occupied (wall)');
    assert(board.isOccupied(TOTAL_ROWS, 0), 'below board should be occupied (floor)');
    assert(board.isOccupied(0, -1), 'left of board should be occupied (wall)');
    assert(board.isOccupied(0, COLS), 'right of board should be occupied (wall)');
    assert(!board.isOccupied(5, 5), 'empty in-bounds cell should NOT be occupied');
  });

  suite('Board — reset clears all cells', ({ assert, assertEqual, Board }) => {
    const board = new Board();
    board.place([[5,5]], 'O');
    board.reset();
    assertEqual(board.getCell(5,5), null, 'cell should be null after reset');
  });

};
