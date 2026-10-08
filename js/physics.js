/**
 * FaustballPhysics - Deterministic 2D Physics & Rule Engine for Faustball (Fistball)
 *
 * Enforces core Faustball rules:
 * - 1-Bounce Rule: The ball may bounce on grass at most once per touch on each half-court.
 *   A second consecutive bounce without a player touch is a fault (point to opponent).
 * - Maximum 3 touches per team before crossing over the center ribbon tape ("Die Leine").
 *   A 4th touch is a fault.
 * - Center Ribbon clearance: The ball must clear over the ribbon tape. Hitting the ribbon
 *   or passing below it is an immediate ribbon fault.
 *
 * Exported for Node.js (CommonJS) and Browser (window.FaustballPhysics).
 */

class FaustballPhysics {
  /**
   * @param {Object} [courtConfig]
   * @param {number} [courtConfig.width=800] - Pitch width in px
   * @param {number} [courtConfig.height=450] - Pitch height in px
   * @param {number} [courtConfig.groundY=400] - Grass surface Y level
   * @param {number} [courtConfig.ribbonX=400] - Center ribbon horizontal position
   * @param {number} [courtConfig.ribbonHeight=120] - Height of ribbon tape above ground
   * @param {number} [courtConfig.gravity=780] - Downward gravitational acceleration (px/s^2)
   * @param {number} [courtConfig.restitution=0.72] - Ball coefficient of restitution on turf bounce
   * @param {number} [courtConfig.ribbonWidth=6] - Ribbon tape thickness (px)
   */
  constructor(courtConfig = {}) {
    this.court = {
      width: courtConfig.width ?? 800,
      height: courtConfig.height ?? 450,
      groundY: courtConfig.groundY ?? 400,
      ribbonX: courtConfig.ribbonX ?? 400,
      ribbonHeight: courtConfig.ribbonHeight ?? 120,
      ...courtConfig
    };

    this.gravity = courtConfig.gravity ?? 780;
    this.restitution = courtConfig.restitution ?? 0.72;
    this.ribbonWidth = courtConfig.ribbonWidth ?? 6;

    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: courtConfig.ballRadius ?? 8
    };

    this.rallyState = {
      activeTeam: 'left',
      bouncesSinceTouch: 0,
      touchesTeamLeft: 0,
      touchesTeamRight: 0,
      lastHitPlayer: null
    };

    this.currentFault = null;

    // Optional event callbacks for audio synthesis & visual particles
    this.onBounce = null;     // (x, y, vy)
    this.onRibbonHit = null;   // (x, y)

    this.resetServe('left');
  }

  /**
   * Top coordinate of the center ribbon tape
   */
  get ribbonTopY() {
    if (this.court.ribbonY !== undefined) {
      return this.court.ribbonY;
    }
    return this.court.groundY - this.court.ribbonHeight;
  }

  /**
   * Reset court & ball state for a serve.
   * @param {'left'|'right'} servingTeam
   * @param {number} [serverX]
   * @param {number} [serverY]
   */
  resetServe(servingTeam = 'left', serverX = null, serverY = null) {
    this.currentFault = null;
    this.rallyState = {
      activeTeam: servingTeam,
      bouncesSinceTouch: 0,
      touchesTeamLeft: 0,
      touchesTeamRight: 0,
      lastHitPlayer: null
    };

    const defaultX = servingTeam === 'left' ? 200 : 600;
    const defaultY = 360;

    this.ball.x = serverX !== null && serverX !== undefined ? serverX : defaultX;
    this.ball.y = serverY !== null && serverY !== undefined ? serverY : defaultY;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  /**
   * Apply a player hit to the ball.
   * Resets consecutive bounce count on this side and increments team touches.
   *
   * @param {'left'|'right'} team
   * @param {string|Object} player - Identifier or player entity
   * @param {'dig'|'set'|'spike'|'serve'|'drop'|'normal'} [type='normal']
   * @param {Object|number} [direction] - Vector { vx, vy }, direction { x, y, speed }, or angle
   */
  hitBall(team, player, type = 'normal', direction = null) {
    this.rallyState.lastHitPlayer = player;
    this.rallyState.activeTeam = team;
    this.rallyState.bouncesSinceTouch = 0;

    // Increment touches and verify 3-touch limit
    if (team === 'left') {
      this.rallyState.touchesTeamLeft++;
      if (this.rallyState.touchesTeamLeft > 3 && !this.currentFault) {
        this.currentFault = {
          faultType: 'FOUR_TOUCHES',
          scoringTeam: 'right',
          reason: 'Left team exceeded maximum 3 touches'
        };
      }
    } else if (team === 'right') {
      this.rallyState.touchesTeamRight++;
      if (this.rallyState.touchesTeamRight > 3 && !this.currentFault) {
        this.currentFault = {
          faultType: 'FOUR_TOUCHES',
          scoringTeam: 'left',
          reason: 'Right team exceeded maximum 3 touches'
        };
      }
    }

    // Apply hit impulses
    if (direction && typeof direction.vx === 'number' && typeof direction.vy === 'number') {
      this.ball.vx = direction.vx;
      this.ball.vy = direction.vy;
    } else if (direction && typeof direction.x === 'number' && typeof direction.y === 'number') {
      const len = Math.hypot(direction.x, direction.y) || 1;
      const speed = direction.speed || (type === 'spike' ? 520 : type === 'set' ? 280 : 340);
      this.ball.vx = (direction.x / len) * speed;
      this.ball.vy = (direction.y / len) * speed;
    } else if (typeof direction === 'number') {
      const speed = type === 'spike' ? 520 : type === 'set' ? 280 : 340;
      this.ball.vx = Math.cos(direction) * speed;
      this.ball.vy = Math.sin(direction) * speed;
    } else {
      const dirSign = team === 'left' ? 1 : -1;
      switch (type) {
        case 'dig':
          this.ball.vx = dirSign * 140;
          this.ball.vy = -380;
          break;
        case 'set':
          this.ball.vx = dirSign * 110;
          this.ball.vy = -430;
          break;
        case 'spike':
          this.ball.vx = dirSign * 500;
          this.ball.vy = -140;
          break;
        case 'serve':
          this.ball.vx = dirSign * 320;
          this.ball.vy = -280;
          break;
        case 'drop':
          this.ball.vx = dirSign * 240;
          this.ball.vy = -200;
          break;
        default:
          this.ball.vx = dirSign * 260;
          this.ball.vy = -300;
          break;
      }
    }
  }

  /**
   * Step the physics simulation by dt seconds.
   * Handles gravity, ball trajectory, ribbon tape collisions, ground bounces,
   * 1-bounce counting, and fault checks.
   *
   * @param {number} [dt=0.016] - Time delta in seconds
   */
  update(dt = 0.016) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.05);

    // Gravity acceleration
    this.ball.vy += this.gravity * safeDt;

    const prevX = this.ball.x;
    const prevY = this.ball.y;
    let nextX = prevX + this.ball.vx * safeDt;
    let nextY = prevY + this.ball.vy * safeDt;

    const ribbonX = this.court.ribbonX;
    const ribbonTop = this.ribbonTopY;
    const halfRibbon = this.ribbonWidth / 2;

    // Check ribbon clearance or collision
    const crossedRibbon =
      (prevX <= ribbonX && nextX >= ribbonX) ||
      (prevX >= ribbonX && nextX <= ribbonX);

    if (crossedRibbon) {
      const dx = nextX - prevX;
      const t = dx !== 0 ? (ribbonX - prevX) / dx : 0;
      const crossY = prevY + t * (nextY - prevY);

      if (crossY < ribbonTop) {
        // High ball cleanly cleared the top of the ribbon tape
        if (prevX <= ribbonX && nextX > ribbonX) {
          this.rallyState.activeTeam = 'right';
          this.rallyState.bouncesSinceTouch = 0;
          this.rallyState.touchesTeamRight = 0;
        } else if (prevX >= ribbonX && nextX < ribbonX) {
          this.rallyState.activeTeam = 'left';
          this.rallyState.bouncesSinceTouch = 0;
          this.rallyState.touchesTeamLeft = 0;
        }
      } else {
        // Low ball struck ribbon tape or passed below ribbon line -> FAULT & bounce back
        if (this.ball.vx > 0) {
          nextX = ribbonX - halfRibbon - (this.ball.radius || 0);
          this.ball.vx = -Math.abs(this.ball.vx) * this.restitution;
        } else if (this.ball.vx < 0) {
          nextX = ribbonX + halfRibbon + (this.ball.radius || 0);
          this.ball.vx = Math.abs(this.ball.vx) * this.restitution;
        } else {
          nextX = prevX < ribbonX ? ribbonX - halfRibbon : ribbonX + halfRibbon;
          this.ball.vx = prevX < ribbonX ? -100 : 100;
        }

        if (!this.currentFault) {
          const scoringTeam = this.rallyState.activeTeam === 'left' ? 'right' : 'left';
          this.currentFault = {
            faultType: 'RIBBON_FAULT',
            scoringTeam,
            reason: 'Ball hit ribbon tape or passed below tape line'
          };
        }

        if (typeof this.onRibbonHit === 'function') {
          this.onRibbonHit(ribbonX, crossY);
        }
      }
    } else {
      // Direct positioning or discrete frame crossing over ribbon top
      if (nextX > ribbonX && this.rallyState.activeTeam === 'left' && nextY < ribbonTop) {
        this.rallyState.activeTeam = 'right';
        this.rallyState.bouncesSinceTouch = 0;
        this.rallyState.touchesTeamRight = 0;
      } else if (nextX < ribbonX && this.rallyState.activeTeam === 'right' && nextY < ribbonTop) {
        this.rallyState.activeTeam = 'left';
        this.rallyState.bouncesSinceTouch = 0;
        this.rallyState.touchesTeamLeft = 0;
      }
    }

    this.ball.x = nextX;
    this.ball.y = nextY;

    // Ground bounce collision
    if (this.ball.y >= this.court.groundY) {
      this.ball.y = this.court.groundY;
      this.ball.vy = -Math.abs(this.ball.vy) * this.restitution;
      this.rallyState.bouncesSinceTouch++;

      if (typeof this.onBounce === 'function') {
        this.onBounce(this.ball.x, this.ball.y, this.ball.vy);
      }

      // Check boundary & bounce rules
      if (this.ball.x < 0 || this.ball.x > this.court.width) {
        if (!this.currentFault) {
          const scoringTeam = this.rallyState.activeTeam === 'left' ? 'right' : 'left';
          this.currentFault = {
            faultType: 'OUT_OF_BOUNDS',
            scoringTeam,
            reason: 'Ball landed out of bounds'
          };
        }
      } else if (this.rallyState.bouncesSinceTouch >= 2) {
        if (!this.currentFault) {
          const scoringTeam = this.rallyState.activeTeam === 'left' ? 'right' : 'left';
          this.currentFault = {
            faultType: 'DOUBLE_BOUNCE',
            scoringTeam,
            reason: 'Second consecutive bounce without touch'
          };
        }
      }
    }
  }

  /**
   * Check if a fault has occurred during the rally.
   * @returns {null|{ faultType: string, scoringTeam: 'left'|'right', reason: string }}
   */
  checkFault() {
    if (this.currentFault) {
      return this.currentFault;
    }

    if (this.rallyState.bouncesSinceTouch >= 2) {
      const scoringTeam = this.rallyState.activeTeam === 'left' ? 'right' : 'left';
      return {
        faultType: 'DOUBLE_BOUNCE',
        scoringTeam,
        reason: 'Second consecutive bounce without player touch'
      };
    }

    if (this.rallyState.touchesTeamLeft > 3) {
      return {
        faultType: 'FOUR_TOUCHES',
        scoringTeam: 'right',
        reason: 'Left team exceeded maximum 3 touches'
      };
    }

    if (this.rallyState.touchesTeamRight > 3) {
      return {
        faultType: 'FOUR_TOUCHES',
        scoringTeam: 'left',
        reason: 'Right team exceeded maximum 3 touches'
      };
    }

    return null;
  }
}

// Node.js CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FaustballPhysics };
}

// Browser global export
if (typeof window !== 'undefined') {
  window.FaustballPhysics = FaustballPhysics;
} else if (typeof globalThis !== 'undefined') {
  globalThis.FaustballPhysics = FaustballPhysics;
}
