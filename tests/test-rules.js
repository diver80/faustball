const assert = require('assert');
const { FaustballPhysics } = require('../js/physics.js');

const court = { width: 800, height: 450, groundY: 400, ribbonX: 400, ribbonHeight: 120 };
const physics = new FaustballPhysics(court);

// Test 1: Serve setup
physics.resetServe('left', 200, 360);
assert.strictEqual(physics.rallyState.activeTeam, 'left');
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 0);

// Test 2: Ball bounces once on left side - valid
physics.ball.x = 250;
physics.ball.y = 400;
physics.ball.vy = 200;
physics.update(0.016);
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 1);
assert.strictEqual(physics.checkFault(), null);

// Test 3: Ball bounces a SECOND time consecutively without touch - fault!
physics.ball.vy = 200;
physics.update(0.016);
const fault = physics.checkFault();
assert.ok(fault, 'Second consecutive bounce must trigger a fault');
assert.strictEqual(fault.scoringTeam, 'right');
assert.strictEqual(fault.faultType, 'DOUBLE_BOUNCE');

// Test 4: Reset serve and touch ball resets bounce counter
physics.resetServe('left', 200, 360);
physics.ball.x = 250;
physics.ball.y = 400;
physics.ball.vy = 200;
physics.update(0.016);
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 1);
// Player touches ball
physics.hitBall('left', 'p1', 'dig');
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 0);
assert.strictEqual(physics.rallyState.touchesTeamLeft, 1);
// Ball bounces again after player touch - should be bounce 1, not 2!
physics.ball.x = 260;
physics.ball.y = 400;
physics.ball.vy = 200;
physics.update(0.016);
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 1);
assert.strictEqual(physics.checkFault(), null, 'Bounce after touch is permitted in Faustball');

// Test 5: Maximum 3 touches per team (left)
physics.resetServe('left', 200, 360);
physics.hitBall('left', 'p1', 'dig');    // Touch 1
assert.strictEqual(physics.rallyState.touchesTeamLeft, 1);
assert.strictEqual(physics.checkFault(), null);

physics.hitBall('left', 'p2', 'set');    // Touch 2
assert.strictEqual(physics.rallyState.touchesTeamLeft, 2);
assert.strictEqual(physics.checkFault(), null);

physics.hitBall('left', 'p1', 'spike');  // Touch 3
assert.strictEqual(physics.rallyState.touchesTeamLeft, 3);
assert.strictEqual(physics.checkFault(), null);

// 4th touch on left side triggers fault!
physics.hitBall('left', 'p2', 'spike');  // Touch 4 -> Fault!
const touchFault = physics.checkFault();
assert.ok(touchFault, '4th touch must trigger fault');
assert.strictEqual(touchFault.faultType, 'FOUR_TOUCHES');
assert.strictEqual(touchFault.scoringTeam, 'right');

// Test 6: Team transition when ball crosses ribbon
physics.resetServe('left', 200, 360);
physics.hitBall('left', 'p1', 'serve', { vx: 300, vy: -200 });
// Ball starts on left
assert.strictEqual(physics.rallyState.activeTeam, 'left');
// Ball moves across ribbonX (400) above ribbon tape
physics.ball.x = 420;
physics.ball.y = 200; // Above ribbon tape (ribbonTopY is 280)
physics.ball.vx = 200;
physics.ball.vy = 50;
physics.update(0.016);
assert.strictEqual(physics.rallyState.activeTeam, 'right');
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 0);
assert.strictEqual(physics.rallyState.touchesTeamRight, 0);

// Double bounce on right side awards point to left
physics.ball.x = 550;
physics.ball.y = 400;
physics.ball.vy = 200;
physics.update(0.016);
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 1);
assert.strictEqual(physics.checkFault(), null);

physics.ball.vy = 200;
physics.update(0.016);
const rightFault = physics.checkFault();
assert.ok(rightFault, 'Double bounce on right awards point to left');
assert.strictEqual(rightFault.scoringTeam, 'left');
assert.strictEqual(rightFault.faultType, 'DOUBLE_BOUNCE');

// Test 7: Maximum 3 touches per team (right side)
physics.resetServe('right', 600, 360);
physics.hitBall('right', 'pr1', 'dig');
physics.hitBall('right', 'pr2', 'set');
physics.hitBall('right', 'pr1', 'spike');
assert.strictEqual(physics.rallyState.touchesTeamRight, 3);
assert.strictEqual(physics.checkFault(), null);

// 4th touch on right triggers fault with point to left
physics.hitBall('right', 'pr2', 'spike');
const rightTouchFault = physics.checkFault();
assert.ok(rightTouchFault, '4th touch on right side must trigger fault');
assert.strictEqual(rightTouchFault.faultType, 'FOUR_TOUCHES');
assert.strictEqual(rightTouchFault.scoringTeam, 'left');

// Test 8: Out of bounds bounce
physics.resetServe('left', 200, 360);
physics.ball.x = -10; // Landed past left baseline
physics.ball.y = 400;
physics.ball.vy = 200;
physics.update(0.016);
const oobFault = physics.checkFault();
assert.ok(oobFault, 'Landing out of bounds must trigger fault');
assert.strictEqual(oobFault.faultType, 'OUT_OF_BOUNDS');

// Test 9: resetServe clears fault
physics.resetServe('right', 600, 360);
assert.strictEqual(physics.checkFault(), null, 'resetServe must clear all faults');

console.log('PASS: test-rules.js passed');
