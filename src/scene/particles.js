/**
 * High-performance procedural particle system for the Gothic cemetery.
 * Embers, spectral wisps, dust, and dead leaves with buffer geometry and bounded lifetimes.
 */
import * as THREE from 'three';

export class CemeteryParticles {
  constructor(scene, isMobile = false) {
    this.scene = scene;
    this.particleCount = isMobile ? 350 : 800;
    this.time = 0;

    this.initSystem();
  }

  initSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.maxLifetimes = new Float32Array(this.particleCount);

    const colorAmber = new THREE.Color(0xFF5400);
    const colorViolet = new THREE.Color(0x9D4EDD);
    const colorGreen = new THREE.Color(0x39FF14);
    const colorBone = new THREE.Color(0xE0D6E6);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Spread across cemetery grounds
      positions[i3] = (Math.random() - 0.5) * 60;
      positions[i3 + 1] = Math.random() * 22;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;

      // Velocities: slow drifting upwards and swirling with wind
      this.velocities[i3] = (Math.random() - 0.5) * 0.4;
      this.velocities[i3 + 1] = 0.3 + Math.random() * 0.8;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.4;

      this.maxLifetimes[i] = 4 + Math.random() * 6;
      this.lifetimes[i] = Math.random() * this.maxLifetimes[i];

      // Palette distribution: 50% amber embers, 30% violet spectral wisps, 15% toxic green, 5% bone dust
      const rand = Math.random();
      let c = colorAmber;
      if (rand > 0.85) c = colorGreen;
      else if (rand > 0.55) c = colorViolet;
      else if (rand < 0.08) c = colorBone;

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      sizes[i] = (rand > 0.85) ? 3.5 : (rand > 0.55 ? 2.8 : 1.8);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom particle texture generated on Canvas to avoid external image asset loading
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.4,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  update(delta) {
    this.time += delta;
    const positions = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      this.lifetimes[i] += delta;

      // Integrate motion
      positions[i3] += this.velocities[i3] * delta + Math.sin(this.time + i) * 0.015;
      positions[i3 + 1] += this.velocities[i3 + 1] * delta;
      positions[i3 + 2] += this.velocities[i3 + 2] * delta + Math.cos(this.time + i) * 0.015;

      // Reset when lifetime expired or drifted too high
      if (this.lifetimes[i] >= this.maxLifetimes[i] || positions[i3 + 1] > 24) {
        this.lifetimes[i] = 0;
        positions[i3] = (Math.random() - 0.5) * 55;
        positions[i3 + 1] = 0.2 + Math.random() * 0.8;
        positions[i3 + 2] = (Math.random() - 0.5) * 55;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }

  setDensity(reduced = false) {
    this.points.material.opacity = reduced ? 0.35 : 0.85;
  }
}
