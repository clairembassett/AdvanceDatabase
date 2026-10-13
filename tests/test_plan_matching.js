/* The browser validates completeness and exports selections, not a score. */
const assert = require('node:assert/strict');
const { validate, serialize } = require('../labs/lab-08/plan-matching.js');
const selections = { SEQ_SCAN: 'ProductScan', FILTERS: 'ProjectScan', PROJECTION: 'TableScan', CROSS_PRODUCT: 'SelectScan' };
assert.equal(validate({}).ready, false);
assert.equal(validate({ SEQ_SCAN: 'ProductScan' }).count, 1);
assert.equal(validate(selections).ready, true);
assert.equal(validate({ ...selections, FILTERS: 'ProductScan' }).ready, false);
assert.deepEqual(validate({ ...selections, FILTERS: 'ProductScan' }).duplicates, ['ProductScan']);
assert.equal(validate({ ...selections, FILTERS: 'MadeUpScan' }).ready, false);
assert.throws(() => serialize({}), /Choose each/);
assert.throws(() => serialize({ ...selections, FILTERS: 'ProductScan' }), /Choose each/);
const text = serialize(selections);
assert(text.startsWith('# Lab 8: DuckDB to microdb operator matching\nformat=lab08-plan-mapping-v1\n'));
assert(text.endsWith('\n'));
for (const [key, value] of Object.entries(selections)) assert(text.includes(`${key}=${value}\n`));
assert(!text.includes('score='));
assert.equal(text.split('\n').filter(line => line.includes('=')).length, 5);
console.log('Plan matching: incomplete/duplicate choices blocked; selections exported unchanged.');
