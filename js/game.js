/**
 * FaustballGame - Main Game Engine, Match State Machine, Controls & Tournament System
 *
 * Integrates:
 * - FaustballPhysics (1-bounce rule, 3-touch limit, ribbon collisions)
 * - SoundEngine (procedural Web Audio API sound effects and fanfares)
 * - SpriteRenderer (high-DPI procedural Canvas 2D graphics)
 * - FaustballAI (cooperative teammate & tiered opponent bots)
 *
 * Exported for Node.js (CommonJS) and Browser (window.FaustballGame).
 */

class FaustballGame {
  constructor(options = {}) {
    this.isHeadless = options.isHeadless ?? false;

    // Canvas & dimensions
    this.canvas = options.canvas || null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = options.width || 800;
    this.height = options.height || 450;
    this.groundY = 400;
    this.ribbonX = 400;
    this.ribbonHeight = 120;

    // Subsystems
    const CourtPhysics = (typeof FaustballPhysics !== 'undefined' ? FaustballPhysics : (typeof require !== 'undefined' ? require('./physics.js').FaustballPhysics : null));
    const AudioEngine = (typeof SoundEngine !== 'undefined' ? SoundEngine : (typeof require !== 'undefined' ? require('./audio.js').SoundEngine : null));
    const Renderer = (typeof SpriteRenderer !== 'undefined' ? SpriteRenderer : (typeof require !== 'undefined' ? require('./sprites.js').SpriteRenderer : null));
    const AIController = (typeof FaustballAI !== 'undefined' ? FaustballAI : (typeof require !== 'undefined' ? require('./ai.js').FaustballAI : null));

    this.physics = CourtPhysics ? new CourtPhysics({
      width: this.width,
      height: this.height,
      groundY: this.groundY,
      ribbonX: this.ribbonX,
      ribbonHeight: this.ribbonHeight
    }) : null;

    this.audio = AudioEngine ? (typeof window !== 'undefined' && window.soundEngine ? window.soundEngine : new AudioEngine()) : null;
    this.sprites = Renderer ? new Renderer() : null;
    this.ai = AIController ? new AIController('switzerland') : null;

    // Game States
    this.STATE_MENU = 'MENU';
    this.STATE_SERVING = 'SERVING';
    this.STATE_RALLY = 'RALLY';
    this.STATE_POINT_SCORED = 'POINT_SCORED';
    this.STATE_SET_END = 'SET_END';
    this.STATE_MATCH_WON = 'MATCH_WON';
    this.STATE_MATCH_LOST = 'MATCH_LOST';
    this.STATE_TOURNAMENT_WIN = 'TOURNAMENT_WIN';
    this.STATE_PAUSED = 'PAUSED';

    this.state = this.STATE_MENU;
    this.previousState = this.STATE_MENU;

    // Scoring & Match Parameters
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.setsLeft = 0;
    this.setsRight = 0;
    this.setsToWin = 2; // Best of 3 sets
    this.totalTournamentPoints = 0;
    this.highScore = 0;

    if (typeof localStorage !== 'undefined') {
      try {
        this.highScore = parseInt(localStorage.getItem('faustball_highscore') || '0', 10);
      } catch (e) {}
    }

    // Tournament Progression
    this.tournamentStages = [
      { id: 'switzerland', name: 'Switzerland 🇨🇭', venue: 'Basel Arena', colors: { primary: '#dc2626', secondary: '#ffffff' } },
      { id: 'austria', name: 'Austria 🇦🇹', venue: 'Vöcklabruck Stadium', colors: { primary: '#ef4444', secondary: '#ffffff' } },
      { id: 'brazil', name: 'Brazil 🇧🇷', venue: 'Novo Hamburgo Park', colors: { primary: '#facc15', secondary: '#15803d' } },
      { id: 'germany', name: 'Germany 🇩🇪', venue: 'Pfungstadt Stadium', colors: { primary: '#0f172a', secondary: '#ffffff' } }
    ];
    this.tournamentStage = 0;

    // Archetype selection
    this.archetypes = {
      cannon: {
        id: 'cannon',
        name: 'The Cannon 💥',
        title: 'Der Hammer-Schläger',
        perk: '+25% Spike Velocity & High Jump Apex',
        specialName: 'Hammer Smash',
        jumpPower: 450,
        spikeMultiplier: 1.25,
        speed: 240
      },
      iron_wall: {
        id: 'iron_wall',
        name: 'The Iron Wall 🛡️',
        title: 'Die Abwehr-Legende',
        perk: '50% Faster Dive Recovery & Extended Reach',
        specialName: 'Golden Hechtbagger',
        jumpPower: 410,
        spikeMultiplier: 1.0,
        speed: 230
      },
      spin_master: {
        id: 'spin_master',
        name: 'The Spin Master 🌪️',
        title: 'Der Zuspiel-Magier',
        perk: 'Drop-shot Precision & Swerve Spin',
        specialName: 'Tornado Slice',
        jumpPower: 420,
        spikeMultiplier: 1.1,
        speed: 250
      }
    };
    this.selectedArchetype = 'cannon';

    // Modifier mode
    this.isBiergarten = false;

    // Special meter (0 to 100)
    this.specialMeter = 0;
    this.specialActive = false;
    this.specialActiveTimer = 0;

    // Entities
    this.playersLeft = [];
    this.playersRight = [];
    this._initPlayers();

    // Input state
    this.keys = {};
    this.touchControls = {
      left: false,
      right: false,
      jump: false,
      dive: false,
      hit: false,
      special: false
    };

    // Animation & timing
    this.serveCooldown = 1.0;
    this.pointDelay = 1.2;
    this.lastFrameTime = 0;

    // Audio & physics wiring
    if (this.physics && this.audio && this.sprites) {
      this.physics.onBounce = (x, y, vy) => {
        this.audio.playBounce(vy);
        this.sprites.spawnTurfKick(x, y, Math.min(10, Math.floor(Math.abs(vy) / 40)));
      };
      this.physics.onRibbonHit = (x, y) => {
        this.audio.playRibbonHit();
        this.sprites.spawnImpactBurst(x, y);
      };
    }
  }

  _initPlayers() {
    // Left Team (User + Teammate)
    this.playersLeft = [
      {
        id: 'player_user',
        isUser: true,
        x: 170,
        y: this.groundY,
        vx: 0,
        vy: 0,
        state: 'idle',
        facing: 'right',
        hitCooldown: 0
      },
      {
        id: 'player_teammate',
        isUser: false,
        x: 290,
        y: this.groundY,
        vx: 0,
        vy: 0,
        state: 'idle',
        facing: 'right',
        hitCooldown: 0
      }
    ];

    // Right Team (Opponent Bots)
    this.playersRight = [
      {
        id: 'opp_front',
        isUser: false,
        x: 510,
        y: this.groundY,
        vx: 0,
        vy: 0,
        state: 'idle',
        facing: 'left',
        hitCooldown: 0
      },
      {
        id: 'opp_back',
        isUser: false,
        x: 650,
        y: this.groundY,
        vx: 0,
        vy: 0,
        state: 'idle',
        facing: 'left',
        hitCooldown: 0
      }
    ];
  }

  getOpponentCountry() {
    return this.tournamentStages[this.tournamentStage]?.id || 'switzerland';
  }

  getScoreMultiplier() {
    return this.isBiergarten ? 1.25 : 1.0;
  }

  toggleBiergarten() {
    this.isBiergarten = !this.isBiergarten;
    if (this.audio) {
      if (this.isBiergarten) {
        this.audio.playBiergartenOompah();
      } else {
        this.audio.stopBiergartenOompah();
      }
    }
    return this.isBiergarten;
  }

  chargeSpecial(amount) {
    this.specialMeter = Math.min(100, Math.max(0, this.specialMeter + amount));
  }

  canActivateSpecial() {
    return this.specialMeter >= 100;
  }

  activateSpecial() {
    if (!this.canActivateSpecial()) return false;
    this.specialMeter = 0;
    this.specialActive = true;
    this.specialActiveTimer = 4.0;
    if (this.audio) this.audio.playPointScored();
    return true;
  }

  startMatch(archetype = 'cannon', isBiergarten = false) {
    this.selectedArchetype = archetype;
    this.isBiergarten = isBiergarten;
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.setsLeft = 0;
    this.setsRight = 0;

    if (this.ai) {
      this.ai.setDifficulty(this.getOpponentCountry());
    }

    this._resetPlayerPositions();
    this.serveBall('left');
    this.state = this.STATE_SERVING;
  }

  _resetPlayerPositions() {
    this.playersLeft[0].x = 170;
    this.playersLeft[0].y = this.groundY;
    this.playersLeft[0].vx = 0;
    this.playersLeft[0].vy = 0;
    this.playersLeft[0].state = 'idle';

    this.playersLeft[1].x = 290;
    this.playersLeft[1].y = this.groundY;
    this.playersLeft[1].vx = 0;
    this.playersLeft[1].vy = 0;
    this.playersLeft[1].state = 'idle';

    this.playersRight[0].x = 510;
    this.playersRight[0].y = this.groundY;
    this.playersRight[0].vx = 0;
    this.playersRight[0].vy = 0;
    this.playersRight[0].state = 'idle';

    this.playersRight[1].x = 650;
    this.playersRight[1].y = this.groundY;
    this.playersRight[1].vx = 0;
    this.playersRight[1].vy = 0;
    this.playersRight[1].state = 'idle';
  }

  serveBall(servingTeam = 'left') {
    if (!this.physics) return;
    const serverX = servingTeam === 'left' ? 140 : 660;
    const serverY = 320;
    this.physics.resetServe(servingTeam, serverX, serverY);

    // Initial serve velocity across ribbon into opponent court
    if (servingTeam === 'left') {
      this.physics.hitBall('left', 'player_user', 'serve', { vx: 360, vy: -380 });
    } else {
      this.physics.hitBall('right', 'opp_back', 'serve', { vx: -360, vy: -380 });
    }

    if (this.audio) {
      this.audio.playWhistle();
      this.audio.playPunch();
    }

    this.state = this.STATE_RALLY;
  }

  checkSetWinner() {
    // Official Faustball set rules: 11 points, win by 2, deuce hard-capped at 15
    if (this.scoreLeft >= 11 && this.scoreLeft - this.scoreRight >= 2) {
      return 'left';
    }
    if (this.scoreRight >= 11 && this.scoreRight - this.scoreLeft >= 2) {
      return 'right';
    }
    if (this.scoreLeft === 15) return 'left';
    if (this.scoreRight === 15) return 'right';
    return null;
  }

  handleSetWin(winner) {
    if (winner === 'left') {
      this.setsLeft++;
      this.totalTournamentPoints += Math.round(250 * this.getScoreMultiplier());
    } else {
      this.setsRight++;
    }

    this.scoreLeft = 0;
    this.scoreRight = 0;

    // Check match victory
    if (this.setsLeft >= this.setsToWin) {
      this.state = this.STATE_MATCH_WON;
      if (this.audio) this.audio.playFanfare();
    } else if (this.setsRight >= this.setsToWin) {
      this.state = this.STATE_MATCH_LOST;
      if (this.audio) this.audio.playWhistle();
    } else {
      // Continue next set
      this.state = this.STATE_SERVING;
      this.serveCooldown = 1.5;
    }
  }

  advanceTournament() {
    this.tournamentStage++;
    this.setsLeft = 0;
    this.setsRight = 0;
    this.scoreLeft = 0;
    this.scoreRight = 0;

    if (this.tournamentStage >= this.tournamentStages.length) {
      this.state = this.STATE_TOURNAMENT_WIN;
      if (this.audio) {
        this.audio.playFanfare();
        this.audio.playCheer();
      }
    } else {
      if (this.ai) {
        this.ai.setDifficulty(this.getOpponentCountry());
      }
      this.state = this.STATE_SERVING;
      this._resetPlayerPositions();
      this.serveCooldown = 1.5;
    }
  }

  update(dt) {
    if (this.state === this.STATE_PAUSED || this.state === this.STATE_MENU) {
      return;
    }

    if (this.sprites) {
      this.sprites.update(dt);
    }

    // Special ability timer
    if (this.specialActive) {
      this.specialActiveTimer -= dt;
      if (this.specialActiveTimer <= 0) {
        this.specialActive = false;
      }
    }

    // Serving cooldown
    if (this.state === this.STATE_SERVING) {
      this.serveCooldown -= dt;
      if (this.serveCooldown <= 0) {
        this.serveBall('left');
      }
      return;
    }

    // Point scored transition delay
    if (this.state === this.STATE_POINT_SCORED) {
      this.pointDelay -= dt;
      if (this.pointDelay <= 0) {
        const setWinner = this.checkSetWinner();
        if (setWinner) {
          this.handleSetWin(setWinner);
        } else {
          this.state = this.STATE_SERVING;
          this.serveCooldown = 1.0;
          this._resetPlayerPositions();
        }
      }
      return;
    }

    // Active Rally Update
    if (this.state === this.STATE_RALLY && this.physics) {
      // 1. Process User Player Input
      this._updateUserPlayer(dt);

      // 2. Process AI Subsystem
      if (this.ai) {
        this.ai.update(dt, this.physics.ball, this.playersLeft, this.playersRight, this.physics);
      }

      // 3. Step Physics Simulation
      this.physics.update(dt);

      // Special particle trails
      if (this.specialActive && this.sprites) {
        this.sprites.spawnFlameTrail(this.physics.ball.x, this.physics.ball.y);
      }

      // 4. Check for Faults (1-bounce, 3-touch, ribbon, out of bounds)
      const fault = this.physics.checkFault();
      if (fault) {
        this._handleFault(fault);
      }
    }
  }

  _updateUserPlayer(dt) {
    const user = this.playersLeft[0];
    const arch = this.archetypes[this.selectedArchetype] || this.archetypes.cannon;
    let speed = arch.speed;

    // Input interpretation (Left / Right)
    let moveLeft = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left;
    let moveRight = this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right;

    // Biergarten Mode Inversion!
    if (this.isBiergarten) {
      const temp = moveLeft;
      moveLeft = moveRight;
      moveRight = temp;
    }

    if (user.state !== 'diving') {
      if (moveLeft) {
        user.vx = -speed;
        user.facing = 'left';
        if (user.state === 'idle') user.state = 'running';
      } else if (moveRight) {
        user.vx = speed;
        user.facing = 'right';
        if (user.state === 'idle') user.state = 'running';
      } else {
        user.vx = 0;
        if (user.state === 'running') user.state = 'idle';
      }

      // Jump input
      const jumpKey = this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.jump;
      if (jumpKey && user.y >= this.groundY - 2) {
        user.state = 'jumping';
        user.vy = -arch.jumpPower;
      }

      // Dive input ("Hechtbagger")
      const diveKey = this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.dive;
      if (diveKey && user.y >= this.groundY - 2) {
        user.state = 'diving';
        user.diveTimer = this.selectedArchetype === 'iron_wall' ? 0.45 : 0.65;
        user.vx = user.facing === 'right' ? 330 : -330;
        if (this.sprites) this.sprites.spawnTurfKick(user.x, user.y, 8);
      }

      // Hit / Spike input
      const hitKey = this.keys['Space'] || this.keys['Enter'] || this.touchControls.hit;
      if (hitKey && (!user.hitCooldown || user.hitCooldown <= 0)) {
        this._tryUserHit(user, arch);
      }

      // Special Ability activation
      const specialKey = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchControls.special;
      if (specialKey && this.canActivateSpecial()) {
        this.activateSpecial();
      }
    }
  }

  _tryUserHit(user, arch) {
    if (!this.physics) return;
    const ball = this.physics.ball;
    const dx = ball.x - user.x;
    const dy = ball.y - (user.y - 20);
    const reach = this.selectedArchetype === 'iron_wall' ? 48 : 38;
    const dist = Math.hypot(dx, dy);

    if (dist <= reach) {
      user.hitCooldown = 0.32;
      const isAerial = user.y < this.groundY - 20;
      const currentTouches = this.physics.rallyState.touchesTeamLeft;

      let hitType = 'dig';
      let vx = 220;
      let vy = -420;

      if (isAerial || currentTouches === 2) {
        // Attack / Spike over ribbon
        hitType = 'spike';
        vx = 480 * (arch.spikeMultiplier || 1.0);
        vy = -160;

        if (this.specialActive && this.selectedArchetype === 'cannon') {
          vx = 680;
          vy = -110;
        } else if (this.specialActive && this.selectedArchetype === 'spin_master') {
          vx = 390;
          vy = -280; // Tricky high spin
        }
      } else if (currentTouches === 0) {
        // Reception dig
        hitType = 'dig';
        vx = 140;
        vy = -450;
      } else {
        // Set
        hitType = 'set';
        vx = 100;
        vy = -490;
      }

      this.physics.hitBall('left', user.id, hitType, { vx, vy });
      this.chargeSpecial(15);

      if (this.audio) {
        this.audio.playPunch(hitType === 'spike');
      }
      if (this.sprites) {
        this.sprites.spawnImpactBurst(ball.x, ball.y);
      }
    }
  }

  _handleFault(fault) {
    this.state = this.STATE_POINT_SCORED;
    this.pointDelay = 1.2;

    if (fault.scoringTeam === 'left') {
      this.scoreLeft++;
      this.totalTournamentPoints += Math.round(100 * this.getScoreMultiplier());
      this.chargeSpecial(20);
      if (this.audio) {
        this.audio.playPointScored();
        this.audio.playCheer();
      }
    } else {
      this.scoreRight++;
      if (this.audio) {
        this.audio.playWhistle();
      }
    }

    if (this.totalTournamentPoints > this.highScore) {
      this.highScore = this.totalTournamentPoints;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('faustball_highscore', this.highScore.toString());
        } catch (e) {}
      }
    }
  }

  render() {
    if (!this.ctx || !this.sprites) return;

    // 1. Draw Pitch, Grandstands, Chalk Lines & Ribbon Tape
    this.sprites.drawPitch(this.ctx, {
      groundY: this.groundY,
      ribbonX: this.ribbonX,
      ribbonHeight: this.ribbonHeight
    }, this.width, this.height);

    // 2. Draw Left Players
    const leftJersey = { primary: '#f8fafc', secondary: '#0f172a' };
    this.playersLeft.forEach((p, idx) => {
      this.sprites.drawPlayer(this.ctx, p, idx === 0 ? this.selectedArchetype : 'iron_wall', leftJersey, this.isBiergarten);
    });

    // 3. Draw Right Players
    const oppTier = this.tournamentStages[this.tournamentStage];
    const rightJersey = oppTier ? oppTier.colors : { primary: '#dc2626', secondary: '#ffffff' };
    this.playersRight.forEach((p, idx) => {
      this.sprites.drawPlayer(this.ctx, p, idx === 0 ? 'cannon' : 'iron_wall', rightJersey, false);
    });

    // 4. Draw Ball with Ground Drop Shadow
    if (this.physics && this.physics.ball) {
      this.sprites.drawBall(this.ctx, this.physics.ball, this.groundY);
    }

    // 5. Draw Particle System
    this.sprites.drawParticles(this.ctx);
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.FaustballGame = FaustballGame;
} else if (typeof globalThis !== 'undefined') {
  globalThis.FaustballGame = FaustballGame;
}

// Node.js CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FaustballGame };
}
