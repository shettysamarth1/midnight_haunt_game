/**
 * Unified pointer swipe controller for Spooky Slicer.
 * Handles mouse, touch, and pointer events, maintains a smoothed trail of points,
 * and renders a glowing toxic-green blade slash with age-based fading.
 */

export class SwipeController {
  constructor(canvasElement, onSwipeSegment) {
    this.canvas = canvasElement;
    this.onSwipeSegment = onSwipeSegment;
    this.isSwiping = false;
    this.points = [];
    this.maxTrailAge = 0.22; // trail points live for 220ms
    this.minSwipeDistance = 8; // min px travel before registering a cut

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: performance.now() / 1000
    };
  }

  onPointerDown(e) {
    this.isSwiping = true;
    this.points = [this.getCanvasCoords(e)];
  }

  onPointerMove(e) {
    if (!this.isSwiping) return;

    const pt = this.getCanvasCoords(e);
    const last = this.points[this.points.length - 1];

    if (last) {
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist >= this.minSwipeDistance) {
        this.points.push(pt);
        if (this.onSwipeSegment) {
          // Provide recent points for collision checks
          this.onSwipeSegment(this.points);
        }
      }
    } else {
      this.points.push(pt);
    }
  }

  onPointerUp() {
    this.isSwiping = false;
  }

  update(dt) {
    const now = performance.now() / 1000;
    // Age out old trail points
    this.points = this.points.filter(p => (now - p.time) < this.maxTrailAge);
  }

  render(ctx) {
    if (this.points.length < 2) return;

    const now = performance.now() / 1000;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw glowing neon-green blade slash
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      const age = now - p2.time;
      const life = Math.max(0, 1 - age / this.maxTrailAge);
      const width = life * 8 + 2;

      // Outer Ghostlight / Toxic Green Glow
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = width * 1.8;
      ctx.strokeStyle = `rgba(57, 255, 20, ${life * 0.35})`;
      ctx.stroke();

      // Sharp Core Neon Blade
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(224, 255, 210, ${life * 0.95})`;
      ctx.stroke();
    }

    ctx.restore();
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }
}
