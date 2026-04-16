// ============================================================
// PIECE — active falling tetromino
// rotation: 0=spawn, 1=CW(R), 2=180, 3=CCW(L)
// row/col: top-left corner of piece's bounding box in board coords
// ============================================================

class Piece {
  constructor(type, row, col, rotation) {
    this.type = type;
    this.row = row !== undefined ? row : SPAWN_ROW[type];
    this.col = col !== undefined ? col : SPAWN_COL;
    this.rotation = rotation || 0;
  }

  // Returns absolute [row, col] pairs for all 4 cells in current state
  getCells() {
    const offsets = PIECE_SHAPES[this.type][this.rotation];
    return offsets.map(([dr, dc]) => [this.row + dr, this.col + dc]);
  }

  clone() {
    return new Piece(this.type, this.row, this.col, this.rotation);
  }

  // Try to move by (dcol, drow). Returns new Piece if valid, null if blocked.
  tryMove(dcol, drow, board) {
    const next = new Piece(this.type, this.row + drow, this.col + dcol, this.rotation);
    if (board.isValid(next.getCells())) return next;
    return null;
  }

  // Try SRS rotation. dir: +1=CW, -1=CCW
  // Returns { piece, kickIndex } if successful, null if all kicks fail.
  tryRotate(dir, board) {
    const nextRot = ((this.rotation + dir) % 4 + 4) % 4;
    const key = getKickKey(this.rotation, nextRot);
    const kicks = getKickTable(this.type)[key];

    // O-piece: no kick table entry — rotation is a visual no-op but succeeds
    if (!kicks) {
      return { piece: new Piece(this.type, this.row, this.col, nextRot), kickIndex: 0 };
    }

    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      // SRS is Y-up; canvas rows are Y-down, so negate dy
      const next = new Piece(this.type, this.row - dy, this.col + dx, nextRot);
      if (board.isValid(next.getCells())) {
        return { piece: next, kickIndex: i };
      }
    }
    return null;
  }

  // Returns the lowest row the piece can occupy (ghost piece position)
  getGhostRow(board) {
    let testRow = this.row;
    while (true) {
      const next = new Piece(this.type, testRow + 1, this.col, this.rotation);
      if (!board.isValid(next.getCells())) break;
      testRow++;
    }
    return testRow;
  }

  // Returns cells at a specific row offset (for ghost drawing)
  getCellsAtRow(row) {
    const offsets = PIECE_SHAPES[this.type][this.rotation];
    return offsets.map(([dr, dc]) => [row + dr, this.col + dc]);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Piece };
}
