const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { FaustballPhysics } = require('../js/physics.js');

// Test 1: Instantiation and default attributes
const court = { width: 800, height: 450, groundY: 400, ribbonX: 400, ribbonHeight: 120 };
const physics = new FaustballPhysics(court);

assert.ok(physics.ball, 'ball attribute must exist');
assert.strictEqual(typeof physics.ball.x, 'number');
assert.strictEqual(typeof physics.ball.y, 'number');
assert.strictEqual(typeof physics.ball.vx, 'number');
assert.strictEqual(typeof physics.ball.vy, 'number');
assert.strictEqual(typeof physics.ball.radius, 'number');

assert.ok(physics.court, 'court attribute must exist');
assert.strictEqual(physics.court.width, 800);
assert.strictEqual(physics.court.height, 450);
assert.strictEqual(physics.court.groundY, 400);
assert.strictEqual(physics.court.ribbonX, 400);
assert.strictEqual(physics.court.ribbonHeight, 120);

assert.ok(physics.rallyState, 'rallyState attribute must exist');
assert.strictEqual(physics.rallyState.activeTeam, 'left');
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 0);
assert.strictEqual(physics.rallyState.touchesTeamLeft, 0);
assert.strictEqual(physics.rallyState.touchesTeamRight, 0);

// Test 2: Gravity acceleration in mid-air
physics.ball.x = 200;
physics.ball.y = 100;
physics.ball.vx = 50;
physics.ball.vy = 0;
const dt = 0.016;
physics.update(dt);

// With g ~ 780 px/s^2, vy should increase by ~780 * 0.016 = 12.48
assert.ok(physics.ball.vy > 10 && physics.ball.vy < 15, `vy should increase by g*dt, got ${physics.ball.vy}`);
assert.ok(physics.ball.y > 100, `ball.y should increase, got ${physics.ball.y}`);
assert.ok(physics.ball.x > 200, `ball.x should increase by vx*dt, got ${physics.ball.x}`);

// Test 3: Grass bounce restitution (e ~ 0.72)
physics.ball.x = 200;
physics.ball.y = 398;
physics.ball.vy = 200; // moving downward fast
physics.update(0.016); // hits ground at 400
// vy should reflect upwards with ~0.72 restitution (-144 approx)
assert.ok(physics.ball.vy < -100 && physics.ball.vy > -170, `vy should bounce upwards with restitution, got ${physics.ball.vy}`);
assert.ok(physics.ball.y <= 400, `ball.y should be clamped at groundY (400), got ${physics.ball.y}`);
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 1);

// Test 4: Ribbon tape collision (over tape vs into tape)
// 4a. Ball passes cleanly OVER ribbon (ribbon top is 400 - 120 = 280)
physics.resetServe('left', 200, 360);
physics.ball.x = 390;
physics.ball.y = 200; // well above ribbon top (280)
physics.ball.vx = 1000;
physics.ball.vy = 0;
physics.update(0.02); // moves past ribbonX (400) to ~410
assert.ok(physics.ball.x > 400, 'Ball should pass freely over ribbon');
assert.ok(physics.ball.vx > 0, 'vx should continue forward');
assert.strictEqual(physics.checkFault(), null, 'Clean clearance over ribbon should not trigger fault');
assert.strictEqual(physics.rallyState.activeTeam, 'right', 'Active team should switch to right');

// 4b. Ball strikes ribbon tape / passes UNDER ribbon (y = 320, below ribbon top 280)
physics.resetServe('left', 200, 360);
physics.ball.x = 395;
physics.ball.y = 320; // below ribbon top (280)
physics.ball.vx = 500;
physics.ball.vy = 0;
physics.update(0.02); // tries to penetrate ribbon
assert.ok(physics.ball.vx < 0, `Ball should bounce backwards off ribbon tape, got vx=${physics.ball.vx}`);
const ribbonFault = physics.checkFault();
assert.ok(ribbonFault, 'Hitting ribbon tape or going under must trigger fault');
assert.strictEqual(ribbonFault.faultType, 'RIBBON_FAULT');
assert.strictEqual(ribbonFault.scoringTeam, 'right');

// 4c. Clean crossing from right to left
physics.resetServe('right', 600, 360);
physics.ball.x = 410;
physics.ball.y = 220; // above ribbon top
physics.ball.vx = -1000;
physics.ball.vy = 0;
physics.update(0.02);
assert.ok(physics.ball.x < 400, 'Ball should pass from right to left over ribbon');
assert.strictEqual(physics.rallyState.activeTeam, 'left');

// Test 5: hitBall impulse and direction vector
physics.resetServe('left', 200, 360);
physics.hitBall('left', 'p1', 'spike', { vx: 450, vy: -150 });
assert.strictEqual(physics.ball.vx, 450);
assert.strictEqual(physics.ball.vy, -150);
assert.strictEqual(physics.rallyState.touchesTeamLeft, 1);
assert.strictEqual(physics.rallyState.lastHitPlayer, 'p1');

// hitBall with angle
physics.hitBall('left', 'p2', 'spike', -Math.PI / 4);
assert.ok(physics.ball.vx > 0, 'Angle should give positive vx');
assert.ok(physics.ball.vy < 0, 'Angle should give negative vy');

// hitBall default presets
physics.hitBall('right', 'p3', 'dig');
assert.ok(physics.ball.vx < 0, 'Right team dig should aim left');
assert.ok(physics.ball.vy < 0, 'Dig should pop upwards');

// Test 6: Determinism across steps
const sim1 = new FaustballPhysics(court);
const sim2 = new FaustballPhysics(court);
sim1.resetServe('left', 200, 360);
sim2.resetServe('left', 200, 360);
sim1.hitBall('left', 'p1', 'set', { vx: 200, vy: -350 });
sim2.hitBall('left', 'p1', 'set', { vx: 200, vy: -350 });

for (let step = 0; step < 60; step++) {
  sim1.update(0.016);
  sim2.update(0.016);
}
assert.strictEqual(sim1.ball.x, sim2.ball.x, 'Simulations must be deterministic in x');
assert.strictEqual(sim1.ball.y, sim2.ball.y, 'Simulations must be deterministic in y');
assert.strictEqual(sim1.ball.vx, sim2.ball.vx, 'Simulations must be deterministic in vx');
assert.strictEqual(sim1.ball.vy, sim2.ball.vy, 'Simulations must be deterministic in vy');

// Test 7: Event callbacks (onBounce & onRibbonHit)
let bounceCallbackFired = false;
let ribbonCallbackFired = false;
const cbPhysics = new FaustballPhysics(court);
cbPhysics.onBounce = (x, y, vy) => {
  bounceCallbackFired = true;
};
cbPhysics.onRibbonHit = (x, y) => {
  ribbonCallbackFired = true;
};

// Trigger bounce
cbPhysics.ball.x = 200;
cbPhysics.ball.y = 400;
cbPhysics.ball.vy = 200;
cbPhysics.update(0.016);
assert.strictEqual(bounceCallbackFired, true, 'onBounce callback must be called on ground hit');

// Trigger ribbon hit
cbPhysics.ball.x = 395;
cbPhysics.ball.y = 350;
cbPhysics.ball.vx = 400;
cbPhysics.ball.vy = 0;
cbPhysics.update(0.02);
assert.strictEqual(ribbonCallbackFired, true, 'onRibbonHit callback must be called on ribbon collision');

// Test 8: Browser global environment export
const code = fs.readFileSync('js/physics.js', 'utf8');
const browserSandbox = { window: {} };
vm.createContext(browserSandbox);
vm.runInContext(code, browserSandbox);
assert.ok(browserSandbox.window.FaustballPhysics, 'FaustballPhysics must export to window in browser');
const browserInstance = new browserSandbox.window.FaustballPhysics(court);
assert.ok(browserInstance, 'FaustballPhysics must instantiate in browser context');

console.log('PASS: test-physics.js passed');
