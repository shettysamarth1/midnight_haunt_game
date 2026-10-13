/**
 * Lighting setup for the Gothic Neon Macabre cemetery environment.
 * Features cool moonlight, amber pumpkin lantern points, and violet/green spectral fills.
 */
import * as THREE from 'three';

export class CemeteryLighting {
  constructor(scene) {
    this.scene = scene;
    this.pumpkinLights = [];
    this.time = 0;

    this.initLights();
  }

  initLights() {
    // 1. Ambient Light - very deep crypt violet
    this.ambientLight = new THREE.AmbientLight(0x170F24, 0.9);
    this.scene.add(this.ambientLight);

    // 2. Moonlight - cool pale lavender/cyan directional light casting soft shadows
    this.moonLight = new THREE.DirectionalLight(0xA2B4D6, 1.4);
    this.moonLight.position.set(20, 45, -30);
    this.scene.add(this.moonLight);

    // 3. Spectral Fill Light - supernatural violet from the crypt depths
    this.spectralFill = new THREE.PointLight(0x9D4EDD, 2.0, 45, 1.5);
    this.spectralFill.position.set(0, 4, 10);
    this.scene.add(this.spectralFill);

    // 4. Toxic Green Energy Accent Light (near altar / crypt)
    this.toxicGreenLight = new THREE.PointLight(0x39FF14, 1.2, 35, 1.8);
    this.toxicGreenLight.position.set(-6, 2, -18);
    this.scene.add(this.toxicGreenLight);
  }

  addPumpkinLight(position) {
    // Amber internal pumpkin glow with bounded oscillation
    const light = new THREE.PointLight(0xFF5400, 2.2, 14, 1.8);
    light.position.copy(position);
    this.scene.add(light);
    this.pumpkinLights.push({
      light,
      baseIntensity: 2.2,
      phase: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 2.0
    });
    return light;
  }

  update(delta) {
    this.time += delta;

    // Smooth, bounded candle/lantern flicker inside pumpkins
    for (const p of this.pumpkinLights) {
      const flicker = Math.sin(this.time * p.speed + p.phase) * 0.35 +
                      Math.sin(this.time * (p.speed * 2.3) + p.phase) * 0.15;
      p.light.intensity = p.baseIntensity + flicker;
    }

    // Subtle breathing pulse for spectral lights
    this.spectralFill.intensity = 2.0 + Math.sin(this.time * 0.8) * 0.35;
    this.toxicGreenLight.intensity = 1.2 + Math.cos(this.time * 1.1) * 0.3;
  }

  setChapterProgress(chapterProgress, chapterIndex) {
    // Seamless transition from cool moonlight violet (Ch 1-2) to intense amber/green (Ch 3-4)
    if (chapterIndex >= 3) {
      // Altar & Arena: heighten amber tension and reduce ambient
      const t = Math.min(1, Math.max(0, chapterProgress));
      this.ambientLight.color.setHex(0x100818);
      this.spectralFill.color.lerp(new THREE.Color(0xFF5400), 0.05);
    } else {
      this.spectralFill.color.lerp(new THREE.Color(0x9D4EDD), 0.05);
    }
  }
}
