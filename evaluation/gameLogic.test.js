import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBet,
  getRiverPayout,
  getRouletteColor,
  getRoulettePayout,
  getSlotPayout,
} from '../src/games/gameLogic.js';

test('slots pay twelve times the bet for three matching symbols', () => {
  assert.equal(getSlotPayout(['7', '7', '7'], 25), 300);
});

test('slots pay two times the bet for an adjacent pair', () => {
  assert.equal(getSlotPayout(['CHILI', 'CHILI', 'HAT'], 25), 50);
  assert.equal(getSlotPayout(['HAT', 'HORSE', 'HORSE'], 25), 50);
});

test('slots pay nothing for a non-matching line', () => {
  assert.equal(getSlotPayout(['7', 'HAT', 'CHILI'], 25), 0);
  assert.equal(getSlotPayout(['7', '7'], 25), 0);
});

test('roulette maps zero, red, and black correctly', () => {
  assert.equal(getRouletteColor(0), 'green');
  assert.equal(getRouletteColor( redNumber()), 'red');
  assert.equal(getRouletteColor(2), 'black');
});

test('roulette pays only matching color bets', () => {
  assert.equal(getRoulettePayout('red', 'red', 25), 50);
  assert.equal(getRoulettePayout('green', 'green', 25), 350);
  assert.equal(getRoulettePayout('red', 'black', 25), 0);
});

test('River Sweep pays for one or two matching groups', () => {
  assert.equal(getRiverPayout(['HAT', 'HAT', 'CHILI'], 25), 50);
  assert.equal(getRiverPayout(['HAT', 'HAT', 'CHILI', 'HORSE'], 25), 0);
  assert.equal(getRiverPayout(['HAT', 'HAT', 'CHILI'], 25), 50);
  assert.equal(getRiverPayout(['HAT', 'CHILI', 'HAT'], 25), 50);
  assert.equal(getRiverPayout(['HAT', 'HAT', 'HAT'], 25), 300);
  assert.equal(getRiverPayout(['HAT', 'CHILI', 'HORSE'], 25), 0);
});

test('bets never reduce credits when the player cannot afford them', () => {
  assert.equal(applyBet(10, 25, 300), 10);
  assert.equal(applyBet(100, 25, 0), 75);
});

function redNumber() { return 1; }
