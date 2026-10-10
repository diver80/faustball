/**
 * FaustballAI - Cooperative Teammate & Tiered International Opponent AI
 *
 * Implements tactical 2v2 Faustball decision-making:
 * - Trajectory & bounce prediction using analytical projectile kinematics
 * - 3-touch rally strategy (Touch 1: Dig/Defend -> Touch 2: Set -> Touch 3: Spike/Drive)
 * - Grass dive triggers ("Hechtbagger") for hard-to-reach balls
 * - Tiered difficulty profiles (Switzerland, Austria, Brazil, Germany)
 *
 * Exported for Node.js (CommonJS) and Browser (window.FaustballAI).
 */

class FaustballAI {
  /**
   * @param {string} [difficulty='switzerland'] - switzerland | austria | brazil | germany
   * @param {Object} [config={}]
   */
  constructor(difficulty = 'switzerland', config = {}) {
    this.difficulty = difficulty;
    this.config = config;

    this.tiers = {
      switzerland: {
        name: 'Switzerland 🇨🇭',
        reactionSpeed: 175,
        jumpProbability: 0.45,
        diveProbability: 0.35,
        spikePower: 390,
        errorMargin: 24
      },
      austria: {
        name: 'Austria 🇦🇹',
        reactionSpeed: 215,
        jumpProbability: 0.65,
        diveProbability: 0.55,
        spikePower: 450,
        errorMargin: 16
      },
      brazil: {
        name: 'Brazil 🇧🇷',
        reactionSpeed: 255,
        jumpProbability: 0.82,
        diveProbability: 0.72,
        spikePower: 510,
        errorMargin: 10
      },
      germany: {
        name: 'Germany 🇩🇪',
        reactionSpeed: 295,
        jumpProbability: 0.94,
        diveProbability: 0.88,
        spikePower: 580,
        errorMargin: 4
      }
    };
  }

  /**
   * Set current tournament opponent tier
   * @param {'switzerland'|'austria'|'brazil'|'germany'} diff
   */
  setDifficulty(diff) {
    if (this.tiers[diff]) {
      this.difficulty = diff;
    }
  }

  /**
   * Analytically predict where and when the ball will hit the ground
   * y(t) = y0 + vy*t + 0.5*g*t^2 = groundY
   * @param {Object} ball { x, y, vx, vy }
   * @param {number} groundY
   * @param {number} gravity
   * @returns {{ x: number, t: number }}
   */
  predictLanding(ball, groundY, gravity) {
    const yDiff = groundY - ball.y;
    if (yDiff <= 0) {
      return { x: ball.x, t: 0 };
    }

    const g = gravity || 780;
    const a = 0.5 * g;
    const b = ball.vy;
    const c = -yDiff;

    const disc = b * b - 4 * a * c;
    if (disc < 0) {
      return { x: ball.x, t: 0.5 };
    }

    const t = (-b + Math.sqrt(disc)) / (2 * a);
    const landingX = ball.x + ball.vx * t;
    return { x: landingX, t: Math.max(0, t) };
  }

  /**
   * Trigger a diving slide on grass ("Hechtbagger")
   * @param {Object} player
   * @param {'left'|'right'} direction
   */
  triggerDive(player, direction = 'right') {
    if (player.state === 'diving') return;
    player.state = 'diving';
    player.diveTimer = 0.62;
    player.vx = direction === 'right' ? 290 : -290;
    player.facing = direction;
  }

  /**
   * Trigger a jump for an aerial spike or block
   * @param {Object} player
   * @param {number} [power=420]
   */
  triggerJump(player, power = 420) {
    if (player.y >= (player.groundY || 400) - 2 && player.state !== 'diving') {
      player.state = 'jumping';
      player.vy = -power;
    }
  }

  /**
   * Main AI decision loop for teammate and opponents
   * @param {number} dt
   * @param {Object} ball
   * @param {Array} leftPlayers
   * @param {Array} rightPlayers
   * @param {FaustballPhysics} physics
   */
  update(dt, ball, leftPlayers, rightPlayers, physics) {
    const court = physics.court;
    const ribbonX = court.ribbonX ?? 400;
    const groundY = court.groundY ?? 400;
    const gravity = physics.gravity ?? 780;
    const activeTeam = physics.rallyState ? physics.rallyState.activeTeam : (ball.x < ribbonX ? 'left' : 'right');

    const landing = this.predictLanding(ball, groundY, gravity);

    // 1. Update player physics & timers (both sides)
    const allPlayers = [...leftPlayers, ...rightPlayers];
    for (const p of allPlayers) {
      p.groundY = groundY;

      // Handle dive timer
      if (p.state === 'diving') {
        p.diveTimer = (p.diveTimer || 0) - dt;
        p.x += (p.vx || 0) * dt;
        p.vx *= 0.94; // Grass friction during slide

        if (p.diveTimer <= 0) {
          p.state = 'idle';
          p.vx = 0;
        }
      } else if (p.y < groundY) {
        // Jumping in air
        p.vy = (p.vy || 0) + gravity * dt;
        p.y += p.vy * dt;
        p.x += (p.vx || 0) * dt;

        if (p.y >= groundY) {
          p.y = groundY;
          p.vy = 0;
          p.state = 'idle';
        }
      } else {
        // On ground
        p.y = groundY;
        p.x += (p.vx || 0) * dt;
      }

      // Hit cooldown
      if (p.hitCooldown) {
        p.hitCooldown -= dt;
        if (p.hitCooldown <= 0) p.hitCooldown = 0;
      }
    }

    // Enforce court boundary constraints
    for (const p of leftPlayers) {
      if (p.x < 25) p.x = 25;
      if (p.x > ribbonX - 14) p.x = ribbonX - 14;
    }
    for (const p of rightPlayers) {
      if (p.x < ribbonX + 14) p.x = ribbonX + 14;
      if (p.x > court.width - 25) p.x = court.width - 25;
    }

    // 2. Cooperative Teammate AI (Left side)
    const user = leftPlayers.find(p => p.isUser) || leftPlayers[0];
    const teammate = leftPlayers.find(p => !p.isUser);
    if (teammate) {
      const teamTouches = physics.rallyState ? physics.rallyState.touchesTeamLeft : 0;

      if (activeTeam === 'left') {
        const userDistToLanding = Math.abs(user.x - landing.x);
        const teammateDistToLanding = Math.abs(teammate.x - landing.x);

        if (teamTouches === 0) {
          // Touch 1: Dig/Reception
          if (teammateDistToLanding < userDistToLanding - 30) {
            this._interceptBall(teammate, ball, landing, 'left', dt, physics, 1);
          } else {
            const supportX = teammate.x > user.x ? 290 : 160;
            this._moveToward(teammate, supportX, 180, dt);
          }
        } else if (teamTouches === 1) {
          // Touch 2: Set the ball near the ribbon for user spike
          if (teammateDistToLanding < userDistToLanding) {
            this._interceptBall(teammate, ball, landing, 'left', dt, physics, 2);
          } else {
            this._moveToward(teammate, 310, 190, dt);
          }
        } else {
          // Touch 3: Attack / Spike
          if (teammateDistToLanding < userDistToLanding - 50 && teammate.x > 240) {
            this._interceptBall(teammate, ball, landing, 'left', dt, physics, 3);
          } else {
            const coverX = teammate.x > user.x ? 280 : 160;
            this._moveToward(teammate, coverX, 170, dt);
          }
        }
      } else {
        // Defensive coverage when ball is in right court
        const defTarget = teammate.x > user.x ? 280 : 160;
        this._moveToward(teammate, defTarget, 160, dt);
      }
    }

    // 3. Opponent Team AI (Right side)
    const tier = this.tiers[this.difficulty] || this.tiers.switzerland;
    const oppDefender = rightPlayers[1] || rightPlayers[0]; // Back player
    const oppAttacker = rightPlayers[0];                    // Front player
    const rightTouches = physics.rallyState ? physics.rallyState.touchesTeamRight : 0;

    if (activeTeam === 'right') {
      // Ball is in opponent court
      if (rightTouches === 0) {
        // Touch 1: Dig/Reception
        const defDist = Math.abs(oppDefender.x - landing.x);
        const attDist = Math.abs(oppAttacker.x - landing.x);

        if (landing.x > ribbonX + 220 || defDist < attDist) {
          // Defender takes reception
          this._interceptBall(oppDefender, ball, landing, 'right', dt, physics, 1, tier);
          this._moveToward(oppAttacker, ribbonX + 100, tier.reactionSpeed, dt);
        } else {
          // Attacker takes reception
          this._interceptBall(oppAttacker, ball, landing, 'right', dt, physics, 1, tier);
          this._moveToward(oppDefender, ribbonX + 250, tier.reactionSpeed, dt);
        }
      } else if (rightTouches === 1) {
        // Touch 2: Setter sets ball high near ribbon
        const designatedSetter = Math.abs(oppAttacker.x - landing.x) < Math.abs(oppDefender.x - landing.x)
          ? oppAttacker
          : oppDefender;
        this._interceptBall(designatedSetter, ball, landing, 'right', dt, physics, 2, tier);
      } else {
        // Touch 3: Attacker spikes or drives into left court!
        this._interceptBall(oppAttacker, ball, landing, 'right', dt, physics, 3, tier);
        this._moveToward(oppDefender, ribbonX + 260, tier.reactionSpeed, dt);
      }
    } else {
      // Ball is on player's side: opponent team shifts into defensive positioning
      this._moveToward(oppAttacker, ribbonX + 110, tier.reactionSpeed * 0.8, dt);
      this._moveToward(oppDefender, ribbonX + 260, tier.reactionSpeed * 0.8, dt);
    }
  }

  _moveToward(player, targetX, speed, dt) {
    if (player.state === 'diving') return;
    const dist = targetX - player.x;
    if (Math.abs(dist) > 6) {
      player.vx = Math.sign(dist) * Math.min(speed, Math.abs(dist) * 6);
      player.facing = dist > 0 ? 'right' : 'left';
      if (player.state === 'idle') player.state = 'running';
    } else {
      player.vx = 0;
      if (player.state === 'running') player.state = 'idle';
    }
  }

  _interceptBall(player, ball, landing, team, dt, physics, touchNumber, tier = null) {
    if (player.state === 'diving') return;

    const speed = tier ? tier.reactionSpeed : 200;
    const dist = landing.x - player.x;

    // Dive trigger check: ball is dropping fast, distance is large
    if (tier && landing.t < 0.28 && Math.abs(dist) > 55 && Math.random() < tier.diveProbability) {
      this.triggerDive(player, dist > 0 ? 'right' : 'left');
      return;
    }

    this._moveToward(player, landing.x, speed, dt);

    // Strike ball if within reach
    const dx = ball.x - player.x;
    const dy = ball.y - (player.y - 20);
    const distToBall = Math.hypot(dx, dy);

    if (distToBall < 38 && (!player.hitCooldown || player.hitCooldown <= 0)) {
      player.hitCooldown = 0.35;

      if (team === 'left') {
        // Teammate strike on left
        if (touchNumber === 1) {
          // High dig towards ribbon setter zone
          physics.hitBall('left', player.id, 'dig', { vx: 180, vy: -420 });
        } else if (touchNumber === 2) {
          // Precision set high near ribbon
          physics.hitBall('left', player.id, 'set', { vx: 90, vy: -480 });
        } else {
          // Smash over ribbon
          physics.hitBall('left', player.id, 'spike', { vx: 420, vy: -180 });
        }
      } else {
        // Opponent strike on right
        const power = tier ? tier.spikePower : 420;
        if (touchNumber === 1) {
          // Dig towards setter
          physics.hitBall('right', player.id, 'dig', { vx: -160, vy: -430 });
        } else if (touchNumber === 2) {
          // High loft set near ribbon
          physics.hitBall('right', player.id, 'set', { vx: -80, vy: -490 });
        } else {
          // Touch 3: Aerial jump spike or hard drive across ribbon into left court!
          if (tier && Math.random() < tier.jumpProbability) {
            this.triggerJump(player, 400);
          }
          const isDrop = Math.random() < 0.25;
          const spikeVx = isDrop ? -180 : -(power * (0.8 + Math.random() * 0.4));
          const spikeVy = isDrop ? -280 : -140 - Math.random() * 80;
          physics.hitBall('right', player.id, 'spike', { vx: spikeVx, vy: spikeVy });
        }
      }
    }
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.FaustballAI = FaustballAI;
} else if (typeof globalThis !== 'undefined') {
  globalThis.FaustballAI = FaustballAI;
}

// Node.js CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FaustballAI };
}
