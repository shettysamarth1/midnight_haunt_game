/**
 * Deterministic physics simulation for Spooky Slicer.
 * Models ballistic trajectory:
 * x(t) = x0 + vx * t
 * y(t) = y0 + vy * t + 0.5 * g * t^2
 */

export const GRAVITY = 720; // pixels / second^2 (downward positive in Canvas 2D)

export class PhysicsEntity {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.rotation = options.rotation || 0;
    this.vRot = options.vRot || (Math.random() - 0.5) * 4.0;
    this.radius = options.radius || 32;
    this.gravity = options.gravity !== undefined ? options.gravity : GRAVITY;
    this.type = options.type || 'pumpkin'; // pumpkin, wisp, skull, candy
    this.isSliced = false;
    this.sliceAngle = 0;
    this.splitOffset = 0;
    this.alpha = 1.0;
    this.isDead = false;
  }

  update(dt, isFrozen = false) {
    if (this.isDead) return;

    if (isFrozen && !this.isSliced) {
      // Time freeze: ballistic motion stops, subtle eerie float
      this.rotation += this.vRot * dt * 0.2;
      return;
    }

    if (!this.isSliced) {
      // Normal ballistic trajectory
      this.x += this.vx * dt;
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.rotation += this.vRot * dt;
    } else {
      // Sliced halves split apart and fall
      this.splitOffset += 160 * dt;
      this.y += (this.vy + 300) * dt;
      this.vy += this.gravity * 1.2 * dt;
      this.alpha = Math.max(0, this.alpha - dt * 2.2);
      if (this.alpha <= 0) {
        this.isDead = true;
      }
    }
  }

  isOutOfBounds(arenaWidth, arenaHeight) {
    // Check if fallen below screen or exited bounds after rising
    return this.y > arenaHeight + 80 && this.vy > 0;
  }
}
