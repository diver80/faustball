const assert = require('assert');
const { FaustballGame } = require('../js/game.js');

// Test 1: Instantiation and default state
const game = new FaustballGame({ isHeadless: true });
assert.strictEqual(game.state, 'MENU');
assert.strictEqual(game.scoreLeft, 0);
assert.strictEqual(game.scoreRight, 0);
assert.strictEqual(game.setsLeft, 0);
assert.strictEqual(game.setsRight, 0);
assert.strictEqual(game.tournamentStage, 0);
assert.strictEqual(game.selectedArchetype, 'cannon');

// Test 2: Point scoring and set win (11 points, win by 2)
game.startMatch('cannon', false);
assert.strictEqual(game.state, 'SERVING');

// Award 10 points to left, 10 to right (Deuce)
game.scoreLeft = 10;
game.scoreRight = 10;
assert.strictEqual(game.checkSetWinner(), null, '10-10 is deuce, no winner yet');

// Left scores 11 (11-10) -> no win yet because must win by 2
game.scoreLeft = 11;
assert.strictEqual(game.checkSetWinner(), null, '11-10 is not win by 2');

// Left scores 12 (12-10) -> Left wins set!
game.scoreLeft = 12;
assert.strictEqual(game.checkSetWinner(), 'left', '12-10 wins by 2');

// Test 3: Set transition
game.handleSetWin('left');
assert.strictEqual(game.setsLeft, 1);
assert.strictEqual(game.scoreLeft, 0);
assert.strictEqual(game.scoreRight, 0);

// Test 4: Tournament stage advancement
const stages = ['switzerland', 'austria', 'brazil', 'germany'];
assert.strictEqual(game.getOpponentCountry(), 'switzerland');
game.advanceTournament();
assert.strictEqual(game.tournamentStage, 1);
assert.strictEqual(game.getOpponentCountry(), 'austria');
game.advanceTournament();
assert.strictEqual(game.getOpponentCountry(), 'brazil');
game.advanceTournament();
assert.strictEqual(game.getOpponentCountry(), 'germany');

// Test 5: Biergarten mode toggle and score multiplier
assert.strictEqual(game.isBiergarten, false);
assert.strictEqual(game.getScoreMultiplier(), 1.0);
game.toggleBiergarten();
assert.strictEqual(game.isBiergarten, true);
assert.strictEqual(game.getScoreMultiplier(), 1.25, 'Biergarten mode must provide 1.25x score multiplier');

// Test 6: Special meter charging and activation
assert.strictEqual(game.specialMeter, 0);
game.chargeSpecial(40);
assert.strictEqual(game.specialMeter, 40);
game.chargeSpecial(70);
assert.strictEqual(game.specialMeter, 100, 'Special meter caps at 100');
assert.strictEqual(game.canActivateSpecial(), true);
game.activateSpecial();
assert.strictEqual(game.specialMeter, 0, 'Activating special resets meter');

console.log('PASS: test-game.js passed');
