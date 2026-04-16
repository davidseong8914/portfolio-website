// ============================================================
// BOARD — 10×22 grid (20 visible + 2 hidden rows above)
// Cells contain null or a piece-type string ('I','O','T',...)
// Row 0 = top (hidden), Row 21 = bottom (floor)
// ============================================================

class Board {
  constructor() {
    this.grid = this._emptyGrid();
  }

  _emptyGrid() {
    return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
  }

  reset() {
    this.grid = this._emptyGrid();
  }

  // Returns true if all [row, col] pairs are in-bounds and empty
  isValid(cells) {
    for (const [r, c] of cells) {
      if (r < 0 || r >= TOTAL_ROWS) return false;
      if (c < 0 || c >= COLS) return false;
      if (this.grid[r][c] !== null) return false;
    }
    return true;
  }

  // Write piece type into grid at given cells
  place(cells, pieceType) {
    for (const [r, c] of cells) {
      this.grid[r][c] = pieceType;
    }
  }

  getCell(row, col) {
    if (row < 0 || row >= TOTAL_ROWS || col < 0 || col >= COLS) return null;
    return this.grid[row][col];
  }

  // Returns array of row indices that are completely filled (bottom to top)
  getFilledRows() {
    const filled = [];
    for (let r = TOTAL_ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== null)) {
        filled.push(r);
      }
    }
    return filled; // already in descending order (bottom-first)
  }

  // Remove given rows and shift everything above down.
  // Sort ascending and adjust splice index so earlier removals don't corrupt later indices.
  // Then prepend empty rows at top all at once.
  clearRows(rowIndices) {
    const sorted = [...rowIndices].sort((a, b) => a - b); // ascending
    for (let i = 0; i < sorted.length; i++) {
      this.grid.splice(sorted[i] - i, 1); // subtract i: each prior removal shifted grid up by 1
    }
    for (let i = 0; i < sorted.length; i++) {
      this.grid.unshift(Array(COLS).fill(null));
    }
  }

  // Check if a cell at (row, col) is occupied (true for out-of-bounds too, for T-spin corners)
  isOccupied(row, col) {
    if (row < 0 || row >= TOTAL_ROWS || col < 0 || col >= COLS) return true;
    return this.grid[row][col] !== null;
  }

  // Deep copy of the grid (for render snapshots)
  cloneGrid() {
    return this.grid.map(row => [...row]);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Board };
}
