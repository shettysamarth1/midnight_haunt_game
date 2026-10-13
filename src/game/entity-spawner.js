/**
 * Entity Spawner & Renderer for Spooky Slicer.
 * Manages Wandering Pumpkins, Spectral Wisps, Cursed Skulls, and Witch's Candy.
 * Provides custom Canvas 2D vector drawing and sliced split half rendering.
 */
import { PhysicsEntity } from './physics.js';

export class EntitySpawner {
  constructor(arenaWidth, arenaHeight) {
    this.width = arenaWidth;
    this.height = arenaHeight;
    this.entities = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.1; // seconds between launches
    this.roundTime = 0;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  update(dt, isFrozen = false, isFrenzy = false) {
    this.roundTime += dt;

    // Difficulty curve: spawn faster as round progresses
    const minInterval = isFrenzy ? 0.35 : Math.max(0.45, 1.1 - (this.roundTime / 60) * 0.6);
    this.spawnTimer += dt;

    if (!isFrozen && this.spawnTimer >= minInterval) {
      this.spawnTimer = 0;
      this.spawnWave(isFrenzy);
    }

    // Update active entities
    for (const entity of this.entities) {
      entity.update(dt, isFrozen);
    }

    // Clean up dead or off-screen entities
    this.entities = this.entities.filter(e => !e.isDead && !e.isOutOfBounds(this.width, this.height));
  }

  spawnWave(isFrenzy = false) {
    const count = isFrenzy ? (Math.random() > 0.4 ? 3 : 2) : (Math.random() > 0.65 ? 2 : 1);
    for (let i = 0; i < count; i++) {
      this.spawnSingle(isFrenzy);
    }
  }

  spawnSingle(isFrenzy = false) {
    // Type selection:
    // Pumpkins: 50%
    // Spectral Wisps: 15%
    // Witch's Candy: 20%
    // Cursed Skulls: 15% (no skulls during frenzy)
    let type = 'pumpkin';
    const rand = Math.random();

    if (isFrenzy) {
      type = rand > 0.4 ? 'pumpkin' : 'candy';
    } else {
      if (rand < 0.15) type = 'skull';
      else if (rand < 0.30) type = 'wisp';
      else if (rand < 0.50) type = 'candy';
      else type = 'pumpkin';
    }

    // Launch coordinates: bottom 10% of arena, spread across middle 80%
    const x = this.width * 0.15 + Math.random() * (this.width * 0.7);
    const y = this.height + 40;

    // Ballistic launch velocities:
    // Horizontal drift toward center
    const centerX = this.width * 0.5;
    const vx = (centerX - x) * (0.8 + Math.random() * 0.6) + (Math.random() - 0.5) * 60;
    // Upward launch reaches between 15% and 40% from top of screen
    const targetApexY = this.height * (0.15 + Math.random() * 0.25);
    const dy = y - targetApexY;
    // v^2 = 2 * g * dy -> vy = -sqrt(2 * g * dy)
    const vy = -Math.sqrt(2 * 720 * dy) * (0.95 + Math.random() * 0.1);

    const radius = (type === 'pumpkin') ? 34 : (type === 'skull' ? 28 : (type === 'wisp' ? 26 : 24));

    const entity = new PhysicsEntity({
      x,
      y,
      vx,
      vy,
      radius,
      type,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3.5
    });

    this.entities.push(entity);
  }

  render(ctx) {
    for (const entity of this.entities) {
      this.drawEntity(ctx, entity);
    }
  }

  drawEntity(ctx, entity) {
    ctx.save();
    ctx.globalAlpha = entity.alpha;

    if (!entity.isSliced) {
      ctx.translate(entity.x, entity.y);
      ctx.rotate(entity.rotation);
      this.drawShape(ctx, entity.type, entity.radius);
    } else {
      // Draw two splitting halves along slice angle
      const perpAngle = entity.sliceAngle + Math.PI / 2;
      const ox = Math.cos(perpAngle) * entity.splitOffset;
      const oy = Math.sin(perpAngle) * entity.splitOffset;

      // Half 1
      ctx.save();
      ctx.translate(entity.x + ox, entity.y + oy);
      ctx.rotate(entity.rotation + entity.splitOffset * 0.02);
      this.drawShape(ctx, entity.type, entity.radius, 1);
      ctx.restore();

      // Half 2
      ctx.save();
      ctx.translate(entity.x - ox, entity.y - oy);
      ctx.rotate(entity.rotation - entity.splitOffset * 0.02);
      this.drawShape(ctx, entity.type, entity.radius, 2);
      ctx.restore();
    }

    ctx.restore();
  }

  drawShape(ctx, type, r, half = 0) {
    ctx.save();

    if (half === 1) {
      ctx.beginPath();
      ctx.rect(-r * 1.5, -r * 1.5, r * 3, r * 1.5);
      ctx.clip();
    } else if (half === 2) {
      ctx.beginPath();
      ctx.rect(-r * 1.5, 0, r * 3, r * 1.5);
      ctx.clip();
    }

    if (type === 'pumpkin') {
      // Wandering Pumpkin: Blood Amber (#FF5400) with dark ridges and glowing face
      ctx.fillStyle = '#FF5400';
      ctx.shadowColor = 'rgba(255, 84, 0, 0.6)';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Carved facial features (Glowing Toxic Green or Bright Gold)
      ctx.fillStyle = '#FFE066';
      // Left Eye
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.2);
      ctx.lineTo(-r * 0.2, -r * 0.45);
      ctx.lineTo(-r * 0.15, -r * 0.15);
      ctx.closePath();
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.moveTo(r * 0.45, -r * 0.2);
      ctx.lineTo(r * 0.2, -r * 0.45);
      ctx.lineTo(r * 0.15, -r * 0.15);
      ctx.closePath();
      ctx.fill();

      // Carved Tooth Smile
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.45, 0.2, Math.PI - 0.2);
      ctx.lineTo(0, r * 0.4);
      ctx.closePath();
      ctx.fill();

      // Stem
      ctx.fillStyle = '#2A3B18';
      ctx.fillRect(-r * 0.1, -r * 1.05, r * 0.2, r * 0.3);
    } else if (type === 'wisp') {
      // Spectral Wisp: Ghostlight Violet (#9D4EDD) & Cyan glowing orb
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
      grad.addColorStop(0, '#E0D6E6');
      grad.addColorStop(0.4, '#9D4EDD');
      grad.addColorStop(1, 'rgba(157, 78, 221, 0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#9D4EDD';
      ctx.shadowBlur = 22;

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Inner pulsating spirit eyes
      ctx.fillStyle = '#39FF14';
      ctx.beginPath();
      ctx.arc(-r * 0.25, -r * 0.1, 3.5, 0, Math.PI * 2);
      ctx.arc(r * 0.25, -r * 0.1, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'skull') {
      // Cursed Skull: Bone White (#E0D6E6) with Red danger glow (#FF1744)
      ctx.fillStyle = '#E0D6E6';
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 18;

      // Cranium
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Jaw
      ctx.fillRect(-r * 0.45, r * 0.1, r * 0.9, r * 0.65);

      // Cursed Red Hollow Eye Sockets
      ctx.fillStyle = '#FF1744';
      ctx.beginPath();
      ctx.ellipse(-r * 0.32, -r * 0.15, r * 0.22, r * 0.28, 0.1, 0, Math.PI * 2);
      ctx.ellipse(r * 0.32, -r * 0.15, r * 0.22, r * 0.28, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Nasal cavity
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-r * 0.1, r * 0.15);
      ctx.lineTo(r * 0.1, r * 0.15);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'candy') {
      // Witch's Candy: Yellow / Orange / White triangular candy corn
      ctx.shadowColor = '#FFB703';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.85, r * 0.8);
      ctx.lineTo(-r * 0.85, r * 0.8);
      ctx.closePath();

      // White tip
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Orange center stripe
      ctx.fillStyle = '#FB8500';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.1);
      ctx.lineTo(r * 0.45, -r * 0.1);
      ctx.lineTo(r * 0.7, r * 0.4);
      ctx.lineTo(-r * 0.7, r * 0.4);
      ctx.closePath();
      ctx.fill();

      // Gold base
      ctx.fillStyle = '#FFB703';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.4);
      ctx.lineTo(r * 0.7, r * 0.4);
      ctx.lineTo(r * 0.85, r * 0.8);
      ctx.lineTo(-r * 0.85, r * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  clear() {
    this.entities = [];
    this.spawnTimer = 0;
    this.roundTime = 0;
  }
}
