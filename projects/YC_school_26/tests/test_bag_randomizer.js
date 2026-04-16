// ============================================================
// TESTS: BagRandomizer
// ============================================================

module.exports = function({ suite }) {

  suite('BagRandomizer — Y is always the first piece', ({ assert, BagRandomizer }) => {
    for (let trial = 0; trial < 10; trial++) {
      const bag = new BagRandomizer();
      const first = bag.next();
      assert(first === 'Y', `Trial ${trial+1}: first piece should be Y, got ${first}`);
    }
  });

  suite('BagRandomizer — reset also gives Y first', ({ assert, BagRandomizer }) => {
    const bag = new BagRandomizer();
    bag.next(); bag.next(); bag.next();
    bag.reset();
    assert(bag.next() === 'Y', 'After reset, first piece should be Y');
  });

  suite('BagRandomizer — weighted distribution over 9000 draws', ({ assert, BagRandomizer, PIECE_WEIGHTS }) => {
    const bag = new BagRandomizer();
    const counts = {};
    for (const t of Object.keys(PIECE_WEIGHTS)) counts[t] = 0;

    // Skip the guaranteed first Y so it doesn't skew the distribution test
    bag.next();

    const DRAWS = 9000;
    for (let i = 0; i < DRAWS; i++) counts[bag.next()]++;

    const totalWeight = Object.values(PIECE_WEIGHTS).reduce((s, w) => s + w, 0);

    for (const [type, weight] of Object.entries(PIECE_WEIGHTS)) {
      const expected = (weight / totalWeight) * DRAWS;
      const tolerance = expected * 0.15; // allow ±15% variance
      const actual = counts[type];
      assert(
        Math.abs(actual - expected) <= tolerance,
        `${type}: expected ~${Math.round(expected)}, got ${actual} (tolerance ±${Math.round(tolerance)})`
      );
    }
  });

  suite('BagRandomizer — peek matches next', ({ assert, assertEqual, BagRandomizer }) => {
    const bag = new BagRandomizer();
    const peeked = bag.peek(5);
    assertEqual(peeked.length, 5, 'peek(5) should return 5 pieces');
    for (let i = 0; i < 5; i++) {
      const drawn = bag.next();
      assertEqual(drawn, peeked[i], `next() #${i+1} should match peek result`);
    }
  });

  suite('BagRandomizer — queue refills, all draws are valid', ({ assert, BagRandomizer, PIECE_TYPES }) => {
    const bag = new BagRandomizer();
    const validTypes = new Set(PIECE_TYPES);
    for (let i = 0; i < 200; i++) {
      const piece = bag.next();
      assert(typeof piece === 'string', `Draw #${i+1} should return a string`);
      assert(validTypes.has(piece), `Draw #${i+1} "${piece}" should be a valid piece type`);
    }
  });

};
