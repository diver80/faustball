const assert = require('assert');
const { FaustballPhysics } = require('../js/physics.js');
const { FaustballAI } = require('../js/ai.js');

const court = { width: 800, height: 450, groundY: 400, ribbonX: 400, ribbonHeight: 120 };
const physics = new FaustballPhysics(court);

// Test 1: Instantiation and difficulty tiers
const aiEasy = new FaustballAI('switzerland');
assert.strictEqual(aiEasy.difficulty, 'switzerland');
assert.ok(aiEasy.tiers.switzerland, 'Tier switzerland must exist');
assert.ok(aiEasy.tiers.germany, 'Tier germany must exist');

const aiHard = new FaustballAI('germany');
assert.strictEqual(aiHard.difficulty, 'germany');
assert.ok(aiHard.tiers.germany.reactionSpeed > aiEasy.tiers.switzerland.reactionSpeed);

// Test 2: Ball landing trajectory prediction
physics.ball.x = 200;
physics.ball.y = 100;
physics.ball.vx = 100;
physics.ball.vy = 0;

const landing = aiEasy.predictLanding(physics.ball, court.groundY, physics.gravity);
assert.ok(landing, 'Landing prediction should return an object');
assert.ok(landing.t > 0, 'Landing time should be positive');
assert.ok(landing.x > 200, `Landing x should be greater than initial x, got ${landing.x}`);
// Analytical check: y(t) = 100 + 0.5 * 780 * t^2 = 400 -> t^2 = 300 / 390 -> t approx 0.877
assert.ok(Math.abs(landing.t - 0.877) < 0.05, `Expected t ~ 0.877s, got ${landing.t}`);
assert.ok(Math.abs(landing.x - (200 + 100 * 0.877)) < 10, `Expected x ~ 287.7, got ${landing.x}`);

// Test 3: Teammate positioning and cooperation on Left side
const leftPlayers = [
  { id: 'p1', x: 150, y: 400, vx: 0, vy: 0, state: 'idle', isUser: true },
  { id: 'p2', x: 280, y: 400, vx: 0, vy: 0, state: 'idle', isUser: false } // AI teammate
];
const rightPlayers = [
  { id: 'opp1', x: 520, y: 400, vx: 0, vy: 0, state: 'idle', isUser: false },
  { id: 'opp2', x: 680, y: 400, vx: 0, vy: 0, state: 'idle', isUser: false }
];

// Ball on left side heading to back court (x=100)
physics.resetServe('left', 100, 200);
physics.ball.vx = -20;
physics.ball.vy = 50;

// Update AI step
aiEasy.update(0.05, physics.ball, leftPlayers, rightPlayers, physics);

// Teammate (p2) should position near setter zone (~280-340) and not crowd player 1 at back
assert.ok(leftPlayers[1].x >= 250, 'Teammate should hold forward setter position');
assert.ok(leftPlayers[1].x <= court.ribbonX - 10, 'Teammate must not cross ribbon');

// Test 4: Opponent AI boundary constraints (never cross ribbon to left)
physics.resetServe('right', 600, 200);
aiHard.update(0.05, physics.ball, leftPlayers, rightPlayers, physics);
assert.ok(rightPlayers[0].x >= court.ribbonX + 10, 'Opponent 1 must stay on right court');
assert.ok(rightPlayers[1].x >= court.ribbonX + 10, 'Opponent 2 must stay on right court');

// Test 5: Dive trigger when ball is dropping fast
const divePlayer = { id: 'd1', x: 600, y: 400, vx: 0, vy: 0, state: 'idle', isUser: false };
aiHard.triggerDive(divePlayer, 'left');
assert.strictEqual(divePlayer.state, 'diving');
assert.ok(divePlayer.diveTimer > 0, 'Dive timer must be set');

console.log('PASS: test-ai.js passed');
