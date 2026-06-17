import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCoords } from '../src/coords';

describe('parseCoords', () => {
  it('accepts valid numeric strings', () => {
    assert.deepEqual(parseCoords('38.8977', '-77.0365'), {
      ok: true,
      lat: 38.8977,
      lon: -77.0365,
    });
  });

  it('requires both values', () => {
    assert.deepEqual(parseCoords(undefined, '0'), { ok: false, error: 'lat and lon are required' });
    assert.deepEqual(parseCoords('0', undefined), { ok: false, error: 'lat and lon are required' });
  });

  it('rejects empty strings (so ?lat= is not read as 0)', () => {
    assert.equal(parseCoords('', '0').ok, false);
  });

  it('rejects non-numeric values', () => {
    const result = parseCoords('abc', '0');
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /valid numbers/);
  });

  it('rejects out-of-range latitude and longitude', () => {
    assert.equal(parseCoords('200', '0').ok, false);
    assert.equal(parseCoords('0', '200').ok, false);
  });

  it('accepts boundary values', () => {
    assert.equal(parseCoords('90', '180').ok, true);
    assert.equal(parseCoords('-90', '-180').ok, true);
  });
});
