/**
 * SpriteRenderer - High-DPI Procedural Canvas 2D Graphics Engine
 *
 * Renders complete retro-arcade Faustball stadium visuals:
 * - Grandstand spectators with wave motion and fluttering country flags
 * - Lawnmower-striped grass turf pitch with crisp white chalk boundary lines
 * - Alternating red/white striped 2m center ribbon tape ("Die Leine")
 * - 2D athletic player sprites (running, jumping, diving "Hechtbagger", spiking)
 * - Overhead "YOU" (P1) floating indicator & golden turf ring for active user player
 * - Serving prompt & controls HUD overlay
 * - Dynamic ground drop shadows with altitude scaling
 * - Particle system (turf spray, impact bursts, flaming spike trails)
 *
 * Exported for Node.js (CommonJS) and Browser (window.SpriteRenderer).
 */

class SpriteRenderer {
  constructor() {
    this.animTime = 0;
    this.particles = [];
  }

  /**
   * Advance animations & particle physics
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    this.animTime += dt;

    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt * (p.decay || 1.8);
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;

      if (p.type === 'turf') {
        p.vy = (p.vy || 0) + 700 * dt; // gravity on grass clumps
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Spawn grass turf particles on bounce, dive, or slide
   * @param {number} x
   * @param {number} y
   * @param {number} [count=6]
   */
  spawnTurfKick(x, y, count = 6) {
    const turfColors = ['#22c55e', '#16a34a', '#15803d', '#84cc16'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 2,
        vx: (Math.random() - 0.5) * 180,
        vy: -80 - Math.random() * 160,
        size: 2.5 + Math.random() * 2.5,
        life: 1.0,
        decay: 2.2,
        color: turfColors[Math.floor(Math.random() * turfColors.length)],
        type: 'turf'
      });
    }
  }

  /**
   * Spawn impact burst on ball hit or ribbon collision
   * @param {number} x
   * @param {number} y
   */
  spawnImpactBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const speed = 70 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 2,
        life: 1.0,
        decay: 3.5,
        color: '#fbbf24',
        type: 'spark'
      });
    }
  }

  /**
   * Spawn flaming rocket trail on special ability spike
   * @param {number} x
   * @param {number} y
   */
  spawnFlameTrail(x, y) {
    const flameColors = ['#ef4444', '#f97316', '#fbbf24', '#ffffff'];
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        size: 4 + Math.random() * 4,
        life: 1.0,
        decay: 4.0,
        color: flameColors[Math.floor(Math.random() * flameColors.length)],
        type: 'flame'
      });
    }
  }

  /**
   * Render complete stadium pitch and arena surroundings
   */
  drawPitch(ctx, court, width, height) {
    const groundY = court.groundY ?? 400;
    const ribbonX = court.ribbonX ?? 400;
    const ribbonHeight = court.ribbonHeight ?? 120;
    const ribbonTop = groundY - ribbonHeight;

    // 1. Sky & Grandstand Spectators
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, groundY);

    // Grandstand bleachers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY - 180, width, 90);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, groundY - 140, width, 50);

    // Spectator crowd dots
    const spectatorColors = ['#f87171', '#60a5fa', '#facc15', '#4ade80', '#c084fc', '#f472b6'];
    for (let sx = 10; sx < width; sx += 18) {
      const bob = Math.sin(this.animTime * 3 + sx * 0.1) * 2;
      const cIdx = Math.floor(Math.abs(Math.sin(sx * 99)) * spectatorColors.length);
      ctx.fillStyle = spectatorColors[cIdx];
      ctx.beginPath();
      ctx.arc(sx, groundY - 145 + bob, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mini country flag on stick occasionally
      if (sx % 72 === 0) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx + 5, groundY - 165 + bob, 1.5, 22);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx + 6.5, groundY - 165 + bob, 10, 6);
      }
    }

    // Grandstand sponsor banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundY - 90, width, 30);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 IFA WORLD TOUR 2026 • FAUSTBALL CHAMPIONSHIP ARENA • 🍺 OKTOBERFEST CUP', width / 2, groundY - 71);

    // 2. Lush Grass Turf Surface
    const stripeW = 40;
    const numStripes = Math.ceil(width / stripeW);
    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534'; // Alternating lawnmower grass stripes
      ctx.fillRect(i * stripeW, groundY, stripeW, height - groundY);
    }

    // Grass turf top fringe border
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, groundY - 2, width, 3);

    // 3. Crisp White Chalk Boundary Lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;

    // Baselines (Left & Right)
    ctx.beginPath();
    ctx.moveTo(20, groundY - 4);
    ctx.lineTo(20, groundY + 45);
    ctx.moveTo(width - 20, groundY - 4);
    ctx.lineTo(width - 20, groundY + 45);
    ctx.stroke();

    // Ground court base chalk line
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(width - 20, groundY);
    ctx.stroke();

    // 3m Service lines (Service zone marked 110px from center on each side)
    const serviceDist = 110;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(ribbonX - serviceDist, groundY);
    ctx.lineTo(ribbonX - serviceDist, groundY + 40);
    ctx.moveTo(ribbonX + serviceDist, groundY);
    ctx.lineTo(ribbonX + serviceDist, groundY + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Service line labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('3m SERVICE', ribbonX - serviceDist, groundY + 20);
    ctx.fillText('3m SERVICE', ribbonX + serviceDist, groundY + 20);

    // 4. Center Ribbon Tape ("Die Leine")
    // Main boundary pole posts
    ctx.fillStyle = '#334155';
    ctx.fillRect(ribbonX - 3, ribbonTop - 25, 6, ribbonHeight + 25);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(ribbonX - 5, groundY - 8, 10, 8); // Post base anchor

    // The Ribbon Tape itself with alternating red & white stripes
    const ribbonThickness = 6;
    const flutter = Math.sin(this.animTime * 4) * 1.5;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, ribbonTop - ribbonThickness / 2 + flutter, width, ribbonThickness);
    if (typeof ctx.clip === 'function') {
      ctx.clip();
    }

    // Striped ribbon fill
    const stripeSize = 16;
    for (let rx = 0; rx < width; rx += stripeSize) {
      ctx.fillStyle = Math.floor(rx / stripeSize) % 2 === 0 ? '#ef4444' : '#ffffff';
      ctx.fillRect(rx, ribbonTop - ribbonThickness + flutter, stripeSize, ribbonThickness * 2);
    }
    ctx.restore();

    // Vertical red antenna flags at center ribbon
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ribbonX - 2, ribbonTop - 35, 4, 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ribbonX - 2, ribbonTop - 25, 4, 10);

    // Ribbon height indicator badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(ribbonX - 24, ribbonTop - 14, 48, 12);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEINE 2.0m', ribbonX, ribbonTop - 5);
  }

  /**
   * Render arcade HUD overlay on canvas for serving & player prompts
   * @param {CanvasRenderingContext2D} ctx
   * @param {'left'|'right'} servingTeam
   * @param {number} width
   * @param {number} height
   */
  drawServingPrompt(ctx, servingTeam, width, height) {
    ctx.save();
    const bob = Math.sin(this.animTime * 6) * 3;

    if (servingTeam === 'left') {
      // User's team serves
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(width / 2 - 210, 68, 420, 48);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 210, 68, 420, 48);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👉 YOUR SERVE! Press [SPACE] or Tap HIT', width / 2, 85 + bob * 0.5);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('Move: A/D or ← → | Jump: W or ↑ | Switch: Q', width / 2, 103);
    } else {
      // Opponent serves
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(width / 2 - 150, 72, 300, 38);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 150, 72, 300, 38);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️ OPPONENT SERVING...', width / 2, 91);
    }
    ctx.restore();
  }

  /**
   * Render an animated player sprite with clear "YOU" indicator for the user
   */
  drawPlayer(ctx, player, archetype = 'cannon', jerseyConfig = { primary: '#fff', secondary: '#000' }, isBiergarten = false) {
    const x = player.x;
    const y = player.y;
    const facing = player.facing || (x < 400 ? 'right' : 'left');
    const state = player.state || 'idle';
    const isRight = facing === 'right';
    const isUser = !!player.isUser;

    ctx.save();
    ctx.translate(x, y);

    // Glowing circular player aura on grass for the user
    if (isUser) {
      const ringRadius = 18 + Math.sin(this.animTime * 6) * 2;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (typeof ctx.ellipse === 'function') {
        ctx.ellipse(0, 4, ringRadius, 6, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 4, ringRadius, 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    // Biergarten stumble sway
    if (isBiergarten) {
      const sway = Math.sin(this.animTime * 5.5 + x * 0.05) * 0.14;
      ctx.rotate(sway);

      // Beer foam bubble particles above head
      const bubbleY = -52 + Math.sin(this.animTime * 4) * 4;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, bubbleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating overhead "YOU" (P1) badge indicator (drawn before horizontal flip so text remains upright)
    if (isUser) {
      const markerBob = Math.sin(this.animTime * 8) * 3;
      const markerY = -52 + markerBob;

      ctx.save();
      // Badge background
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-22, markerY - 13, 44, 15, 4);
      } else {
        ctx.rect(-22, markerY - 13, 44, 15);
      }
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Text "YOU"
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU', 0, markerY - 5);

      // Downward pointer arrow
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-4, markerY + 2);
      ctx.lineTo(4, markerY + 2);
      ctx.lineTo(0, markerY + 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (!isRight) {
      ctx.scale(-1, 1);
    }

    // 1. Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(0, 4, state === 'diving' ? 22 : 12, 4, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(0, 4, state === 'diving' ? 16 : 8, 0, Math.PI * 2);
    }
    ctx.fill();

    if (state === 'diving') {
      // 2. Diving Pose ("Hechtbagger" grass slide)
      // Legs stretched horizontally behind
      ctx.fillStyle = jerseyConfig.secondary || '#1e293b';
      ctx.fillRect(-26, -10, 16, 8); // Legs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-32, -10, 6, 6); // Cleats

      // Torso sliding forward
      ctx.fillStyle = jerseyConfig.primary || '#dc2626';
      ctx.fillRect(-12, -14, 18, 11);

      // Outstretched arms forward with closed fist
      ctx.fillStyle = '#fbcfe8'; // Skin
      ctx.fillRect(4, -13, 16, 6);
      ctx.fillStyle = '#f472b6'; // Closed fist
      ctx.beginPath();
      ctx.arc(22, -10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(6, -20, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 3. Upright / Running / Jumping Pose
      const runCycle = Math.sin(this.animTime * 12);
      const isJumping = state === 'jumping' || state === 'spiking';

      // Legs
      ctx.fillStyle = jerseyConfig.secondary || '#1e293b';
      if (isJumping) {
        // Tucked jumping legs
        ctx.fillRect(-6, -12, 6, 12);
        ctx.fillRect(2, -8, 6, 10);
      } else {
        // Running stride
        const legShift = state === 'running' ? runCycle * 6 : 0;
        ctx.fillRect(-7 - legShift, -16, 6, 16);
        ctx.fillRect(3 + legShift, -16, 6, 16);
      }

      // Shoes
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-8, -2, 7, 3);
      ctx.fillRect(2, -2, 7, 3);

      // Torso / Jersey
      ctx.fillStyle = jerseyConfig.primary || '#dc2626';
      ctx.fillRect(-8, -32, 18, 17);

      // Archetype specific jersey accents
      if (archetype === 'cannon') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4, -28, 10, 4); // Power stripe
      } else if (archetype === 'iron_wall') {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-6, -30, 4, 14); // Defensive band
      } else if (archetype === 'spin_master') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-3, -27, 8, 8); // Tactical crest
      }

      // Arms & Fist
      ctx.fillStyle = '#fbcfe8'; // Skin
      if (state === 'spiking') {
        // Cocked fist in air for aerial spike
        ctx.fillRect(2, -44, 6, 14);
        ctx.fillStyle = '#f472b6'; // Raised closed fist
        ctx.beginPath();
        ctx.arc(5, -46, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ready fist/forearm position
        ctx.fillRect(6, -26, 10, 5);
        ctx.fillStyle = '#f472b6'; // Closed fist
        ctx.beginPath();
        ctx.arc(17, -23, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(1, -38, 7, 0, Math.PI * 2);
      ctx.fill();

      // Hair / Archetype Headgear
      if (archetype === 'cannon') {
        // Red karate/striker headband
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-6, -42, 14, 3.5);
      } else if (archetype === 'spin_master') {
        // Tactical sunglasses
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, -39, 6, 3);
      } else {
        // Brown athletic hair
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, -42, 6, Math.PI, 0);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Render the Faustball with rotation and ground altitude shadow
   */
  drawBall(ctx, ball, groundY = 400) {
    const x = ball.x;
    const y = ball.y;
    const radius = ball.radius || 8;
    const altitude = Math.max(0, groundY - y);

    // 1. Dynamic Ground Altitude Drop Shadow
    const shadowScale = Math.max(0.4, 1.0 - altitude / 350);
    const shadowAlpha = Math.max(0.12, 0.45 - altitude / 500);

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(x, groundY + 4, radius * 1.8 * shadowScale, radius * 0.7 * shadowScale, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(x, groundY + 4, radius * shadowScale, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // 2. Leather Faustball Body
    ctx.save();
    ctx.translate(x, y);

    // Subtle spin rotation based on horizontal velocity
    const rot = (x * 0.05) % (Math.PI * 2);
    ctx.rotate(rot);

    // White leather sphere with radial 3D lighting gradient
    let grad = null;
    if (typeof ctx.createRadialGradient === 'function') {
      grad = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 1, 0, 0, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#e2e8f0');
      grad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#f8fafc';
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Stitched leather seam lines (official 12-panel Faustball pattern)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, 0);
    ctx.lineTo(radius * 0.7, 0);
    ctx.stroke();

    // Ball outer rim definition
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render active particle system
   */
  drawParticles(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, Math.min(1, p.life));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'turf') {
        // Turf clumps
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'flame') {
        // Flame particles with soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life)), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Star spark
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.SpriteRenderer = SpriteRenderer;
} else if (typeof globalThis !== 'undefined') {
  globalThis.SpriteRenderer = SpriteRenderer;
}

// Node.js CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpriteRenderer };
}
