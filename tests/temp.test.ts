import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { characterizeTemperature } from '../src/temp';

describe('characterizeTemperature', () => {
  it('classifies below 50°F as cold', () => {
    assert.equal(characterizeTemperature(32), 'cold');
    assert.equal(characterizeTemperature(49), 'cold');
  });

  it('treats the 50°F boundary as moderate (exclusive)', () => {
    assert.equal(characterizeTemperature(50), 'moderate');
  });

  it('classifies 50–80°F as moderate', () => {
    assert.equal(characterizeTemperature(65), 'moderate');
  });

  it('treats the 80°F boundary as moderate (exclusive)', () => {
    assert.equal(characterizeTemperature(80), 'moderate');
  });

  it('classifies above 80°F as hot', () => {
    assert.equal(characterizeTemperature(81), 'hot');
    assert.equal(characterizeTemperature(100), 'hot');
  });
});
