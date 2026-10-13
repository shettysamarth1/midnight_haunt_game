/**
 * Automated test suite for Midnight Haunt: Spooky Slicer.
 * Verifies core game logic, physics, collision detection, scoring, frenzy, and state machines.
 */
import assert from 'node:assert';
import { PhysicsEntity, GRAVITY } from '../src/game/physics.js';
import { lineSegmentIntersectsCircle, testSwipeAgainstEntity } from '../src/game/collision.js';
import { ScoreSystem } from '../src/game/scoring.js';
import { GameStates, GameStateMachine } from '../src/game/game-state.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('\n--- Running Spooky Slicer Test Suite ---');

// 1. Physics Trajectory Tests
test('Physics: Ballistic trajectory updates correctly over time', () => {
  const entity = new PhysicsEntity({ x: 100, y: 500, vx: 50, vy: -400, gravity: GRAVITY });
  const dt = 0.5; // half second
  entity.update(dt, false);

  // x = 100 + 50 * 0.5 = 125
  assert.strictEqual(entity.x, 125);
  // vy = -400 + 720 * 0.5 = -40
  assert.strictEqual(entity.vy, -40);
  // y = 500 + (-40) * 0.5 = 480
  assert.strictEqual(entity.y, 480);
});

test('Physics: Time freeze halts ballistic movement for unsliced entities', () => {
  const entity = new PhysicsEntity({ x: 200, y: 300, vx: 100, vy: -200 });
  entity.update(0.1, true); // frozen
  assert.strictEqual(entity.x, 200);
  assert.strictEqual(entity.y, 300);
});

test('Physics: Sliced entities continue splitting and fading during freeze', () => {
  const entity = new PhysicsEntity({ x: 200, y: 300 });
  entity.isSliced = true;
  entity.update(0.1, true);
  assert.ok(entity.splitOffset > 0);
  assert.ok(entity.alpha < 1.0);
});

// 2. Collision Detection Tests
test('Collision: Line segment directly intersecting circle returns true', () => {
  const hit = lineSegmentIntersectsCircle(0, 100, 200, 100, 100, 100, 30);
  assert.strictEqual(hit, true);
});

test('Collision: Line segment completely missing circle returns false', () => {
  const hit = lineSegmentIntersectsCircle(0, 0, 200, 0, 100, 100, 30);
  assert.strictEqual(hit, false);
});

test('Collision: Segment endpoint inside circle returns true', () => {
  const hit = lineSegmentIntersectsCircle(0, 0, 105, 95, 100, 100, 30);
  assert.strictEqual(hit, true);
});

test('Collision: Swipe points against active entity returns hit and angle', () => {
  const entity = { x: 150, y: 150, radius: 25, isSliced: false, isDead: false };
  const swipePoints = [{ x: 100, y: 150 }, { x: 200, y: 150 }];
  const res = testSwipeAgainstEntity(swipePoints, entity);
  assert.strictEqual(res.hit, true);
  assert.strictEqual(res.angle, 0); // Horizontal swipe
});

test('Collision: Sliced entity cannot be hit again (duplicate hit prevention)', () => {
  const entity = { x: 150, y: 150, radius: 25, isSliced: true, isDead: false };
  const swipePoints = [{ x: 100, y: 150 }, { x: 200, y: 150 }];
  const res = testSwipeAgainstEntity(swipePoints, entity);
  assert.strictEqual(res.hit, false);
});

// 3. Scoring & Combo System Tests
test('Scoring: Wandering Pumpkin scores 100 base points', () => {
  const scoreSystem = new ScoreSystem();
  const res = scoreSystem.registerHit('pumpkin');
  assert.strictEqual(res.points, 100);
  assert.strictEqual(scoreSystem.score, 100);
  assert.strictEqual(scoreSystem.combo, 1);
  assert.strictEqual(scoreSystem.multiplier, 1);
});

test('Scoring: Spectral Wisp scores 250 base points', () => {
  const scoreSystem = new ScoreSystem();
  const res = scoreSystem.registerHit('wisp');
  assert.strictEqual(res.points, 250);
  assert.strictEqual(scoreSystem.score, 250);
});

test('Scoring: Consecutive hits progress combo multiplier through 2x, 4x, 8x', () => {
  const scoreSystem = new ScoreSystem();
  // 3 hits -> 2x
  scoreSystem.registerHit('pumpkin');
  scoreSystem.registerHit('pumpkin');
  let res = scoreSystem.registerHit('pumpkin');
  assert.strictEqual(res.combo, 3);
  assert.strictEqual(scoreSystem.multiplier, 2);

  // 6 hits -> 4x
  scoreSystem.registerHit('pumpkin');
  scoreSystem.registerHit('pumpkin');
  res = scoreSystem.registerHit('pumpkin');
  assert.strictEqual(res.combo, 6);
  assert.strictEqual(scoreSystem.multiplier, 4);

  // 10 hits -> 8x
  scoreSystem.registerHit('pumpkin');
  scoreSystem.registerHit('pumpkin');
  scoreSystem.registerHit('pumpkin');
  res = scoreSystem.registerHit('pumpkin');
  assert.strictEqual(res.combo, 10);
  assert.strictEqual(scoreSystem.multiplier, 8);
  assert.strictEqual(res.points, 800); // 100 base * 8
});

test('Scoring: Slicing 3 Witch Candies in a streak activates Frenzy Harvest', () => {
  let frenzyTriggered = false;
  const scoreSystem = new ScoreSystem({
    onFrenzyStart: () => { frenzyTriggered = true; }
  });

  scoreSystem.registerHit('candy');
  scoreSystem.registerHit('candy');
  assert.strictEqual(scoreSystem.isFrenzy, false);
  scoreSystem.registerHit('candy');
  assert.strictEqual(scoreSystem.isFrenzy, true);
  assert.strictEqual(frenzyTriggered, true);
});

test('Scoring: Slicing Cursed Skull deducts 1 life and resets combo', () => {
  const scoreSystem = new ScoreSystem();
  scoreSystem.registerHit('pumpkin');
  scoreSystem.registerHit('pumpkin');
  assert.strictEqual(scoreSystem.combo, 2);

  const res = scoreSystem.registerHit('skull');
  assert.strictEqual(res.skull, true);
  assert.strictEqual(scoreSystem.lives, 2);
  assert.strictEqual(scoreSystem.combo, 0);
  assert.strictEqual(scoreSystem.multiplier, 1);
});

// 4. State Machine Tests
test('StateMachine: Transitions cleanly through game states', () => {
  let latestState = null;
  const sm = new GameStateMachine((next) => { latestState = next; });

  assert.strictEqual(sm.is(GameStates.READY), true);
  sm.transitionTo(GameStates.COUNTDOWN);
  assert.strictEqual(latestState, GameStates.COUNTDOWN);

  sm.transitionTo(GameStates.PLAYING);
  assert.strictEqual(sm.canAcceptGameplayInput(), true);

  sm.pause();
  assert.strictEqual(sm.is(GameStates.PAUSED), true);
  assert.strictEqual(sm.canAcceptGameplayInput(), false);

  sm.resume();
  assert.strictEqual(sm.is(GameStates.PLAYING), true);

  sm.transitionTo(GameStates.VICTORY);
  assert.strictEqual(sm.is(GameStates.VICTORY), true);
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed with 100% success!\n');
}
