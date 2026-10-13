/**
 * Three.js Cemetery World for Midnight Haunt.
 * Procedural low-poly Victorian Gothic cemetery:
 * - Moonlit sky and giant gothic moon
 * - Winding cracked path & uneven terrain
 * - Crooked headstones and Celtic crosses
 * - Twisted leafless trees
 * - Glowing carved jack-o'-lantern pumpkins
 * - Distant crypt mausoleum and arches
 */
import * as THREE from 'three';
import { CemeteryLighting } from './lighting.js';
import { CemeteryParticles } from './particles.js';

export class CemeteryWorld {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.clock = new THREE.Clock();

    // Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08040B);
    this.scene.fog = new THREE.FogExp2(0x08040B, 0.024);

    // Camera Rig
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 150);
    this.camera.position.set(0, 3.5, 16);
    this.cameraTarget = new THREE.Vector3(0, 2.5, 0);

    // Smooth camera targets driven by scroll
    this.targetCameraPos = new THREE.Vector3(0, 3.5, 16);
    this.targetLookAt = new THREE.Vector3(0, 2.5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Subsystems
    this.lighting = new CemeteryLighting(this.scene);
    this.particles = new CemeteryParticles(this.scene, window.innerWidth < 768);

    // Build World Geometry
    this.buildTerrain();
    this.buildMoon();
    this.buildPath();
    this.buildGravestones();
    this.buildTrees();
    this.buildPumpkins();
    this.buildCryptMausoleum();

    // Event Bindings
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Animation Loop
    this.isRunning = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildTerrain() {
    // Uneven hilly ground plane
    const terrainGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle rolling hill noise with depressed center for cemetery path
      const distFromCenter = Math.abs(x);
      let y = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.2;
      if (distFromCenter < 4) {
        y *= 0.2; // flatter pathway
      }
      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x110B1A,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });
    this.terrain = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrain.position.y = -0.5;
    this.scene.add(this.terrain);
  }

  buildMoon() {
    // Giant Pale Violet / Silver Full Moon
    const moonGeo = new THREE.SphereGeometry(6, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xDDE6FF
    });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moon.position.set(16, 28, -55);
    this.scene.add(this.moon);

    // Moon Glow Billboard Halo
    const haloGeo = new THREE.PlaneGeometry(24, 24);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(157, 78, 221, 0.5)');
    grad.addColorStop(0.5, 'rgba(157, 78, 221, 0.15)');
    grad.addColorStop(1, 'rgba(8, 4, 11, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const haloTexture = new THREE.CanvasTexture(canvas);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const moonHalo = new THREE.Mesh(haloGeo, haloMat);
    moonHalo.position.copy(this.moon.position);
    moonHalo.position.z += 0.5;
    this.scene.add(moonHalo);
  }

  buildPath() {
    // Cobblestone path markers
    const stoneGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2A1F38,
      roughness: 0.85,
      flatShading: true
    });

    this.pathGroup = new THREE.Group();
    for (let z = 18; z > -35; z -= 1.6) {
      const offsetX = Math.sin(z * 0.12) * 1.8;
      const stone1 = new THREE.Mesh(stoneGeo, stoneMat);
      stone1.position.set(offsetX - 0.6 + (Math.random() - 0.5) * 0.3, -0.4, z);
      stone1.rotation.y = (Math.random() - 0.5) * 0.4;
      stone1.scale.set(0.9 + Math.random() * 0.3, 1, 0.8 + Math.random() * 0.4);

      const stone2 = new THREE.Mesh(stoneGeo, stoneMat);
      stone2.position.set(offsetX + 0.6 + (Math.random() - 0.5) * 0.3, -0.4, z + 0.4);
      stone2.rotation.y = (Math.random() - 0.5) * 0.4;
      stone2.scale.set(0.9 + Math.random() * 0.3, 1, 0.8 + Math.random() * 0.4);

      this.pathGroup.add(stone1, stone2);
    }
    this.scene.add(this.pathGroup);
  }

  buildGravestones() {
    this.tombstones = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x362B44,
      roughness: 0.9,
      flatShading: true
    });

    const archedGeo = new THREE.BoxGeometry(0.9, 1.4, 0.25);
    const crossVertGeo = new THREE.BoxGeometry(0.3, 1.6, 0.2);
    const crossHorizGeo = new THREE.BoxGeometry(0.9, 0.25, 0.2);

    // Scatter 40 crooked gravestones along both sides of the path
    for (let i = 0; i < 40; i++) {
      const side = (i % 2 === 0) ? 1 : -1;
      const z = 16 - (i * 1.3) + (Math.random() - 0.5) * 2;
      const pathX = Math.sin(z * 0.12) * 1.8;
      const x = pathX + side * (3.0 + Math.random() * 6.5);

      const grave = new THREE.Group();

      if (i % 3 === 0) {
        // Celtic cross marker
        const vert = new THREE.Mesh(crossVertGeo, stoneMat);
        const horiz = new THREE.Mesh(crossHorizGeo, stoneMat);
        horiz.position.y = 0.3;
        grave.add(vert, horiz);
      } else {
        // Classic arched headstone
        const stone = new THREE.Mesh(archedGeo, stoneMat);
        grave.add(stone);
      }

      grave.position.set(x, 0.4, z);
      // Crooked, sunken graveyard tilt
      grave.rotation.y = (Math.random() - 0.5) * 1.2;
      grave.rotation.z = (Math.random() - 0.5) * 0.25;
      grave.rotation.x = (Math.random() - 0.5) * 0.2;

      this.tombstones.add(grave);
    }
    this.scene.add(this.tombstones);
  }

  buildTrees() {
    this.treeGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x0E0814,
      roughness: 0.98,
      flatShading: true
    });

    // Procedural crooked leafless gothic tree generator
    const createTree = (x, z, scale = 1) => {
      const tree = new THREE.Group();
      const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.5 * scale, 4.5 * scale, 6);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 2.2 * scale;
      trunk.rotation.z = (Math.random() - 0.5) * 0.3;
      tree.add(trunk);

      // Twisted branches
      for (let b = 0; b < 4; b++) {
        const branchGeo = new THREE.CylinderGeometry(0.08 * scale, 0.2 * scale, 2.4 * scale, 5);
        const branch = new THREE.Mesh(branchGeo, woodMat);
        branch.position.set(0, 3.2 * scale, 0);
        branch.rotation.z = 0.6 + (b * 0.35) * (b % 2 === 0 ? 1 : -1);
        branch.rotation.y = (b * Math.PI) / 2 + (Math.random() - 0.5) * 0.5;
        tree.add(branch);
      }

      tree.position.set(x, -0.2, z);
      return tree;
    };

    // Plant 12 trees flanking the graveyard
    const treePositions = [
      [-6, 12], [7, 10], [-9, 2], [8, -4],
      [-8, -12], [9, -16], [-7, -22], [8, -26],
      [-12, -32], [11, -34], [-6, -40], [7, -42]
    ];

    for (const [tx, tz] of treePositions) {
      const tree = createTree(tx, tz, 1.0 + Math.random() * 0.5);
      this.treeGroup.add(tree);
    }
    this.scene.add(this.treeGroup);
  }

  buildPumpkins() {
    this.pumpkins = new THREE.Group();
    const pumpkinMat = new THREE.MeshStandardMaterial({
      color: 0xFF5400, // Blood Amber
      roughness: 0.7,
      flatShading: true
    });
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2A3B18,
      roughness: 0.9
    });

    const pumpkinGeo = new THREE.SphereGeometry(0.45, 8, 7);
    pumpkinGeo.scale(1, 0.75, 1);
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.25, 4);

    const pumpkinSpots = [
      [-2.4, 0.0, 11],
      [2.6, 0.0, 7],
      [-2.8, 0.0, -2],
      [2.9, 0.0, -9],
      [-2.2, 0.0, -17],
      [2.5, 0.0, -24]
    ];

    for (const [px, py, pz] of pumpkinSpots) {
      const pGroup = new THREE.Group();
      const body = new THREE.Mesh(pumpkinGeo, pumpkinMat);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.38;
      pGroup.add(body, stem);

      pGroup.position.set(px, py, pz);
      pGroup.rotation.y = Math.random() * Math.PI * 2;
      this.pumpkins.add(pGroup);

      // Attach internal flickering amber point light
      this.lighting.addPumpkinLight(new THREE.Vector3(px, py + 0.3, pz));
    }
    this.scene.add(this.pumpkins);
  }

  buildCryptMausoleum() {
    // Distant Gothic Mausoleum at the crypt path end
    this.cryptGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1E1428,
      roughness: 0.85,
      flatShading: true
    });

    // Base structure
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), stoneMat);
    base.position.set(0, 2.5, -36);

    // Gothic Roof Arch / Spire
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 4, 4), stoneMat);
    roof.position.set(0, 7.5, -36);
    roof.rotation.y = Math.PI / 4;

    // Crypt Arch Columns
    const colGeo = new THREE.CylinderGeometry(0.4, 0.5, 5, 6);
    const leftCol = new THREE.Mesh(colGeo, stoneMat);
    leftCol.position.set(-3.5, 2.0, -31.8);
    const rightCol = new THREE.Mesh(colGeo, stoneMat);
    rightCol.position.set(3.5, 2.0, -31.8);

    this.cryptGroup.add(base, roof, leftCol, rightCol);
    this.scene.add(this.cryptGroup);
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  updateScroll(progress) {
    // Progress is 0.0 to 1.0 mapped across 4 Chapters
    // Ch 1: Cemetery Gates (0.00 - 0.25)
    // Ch 2: Crypt Descent (0.26 - 0.55) -> tilt downward ~35 deg, advance forward
    // Ch 3: Altar Entrance (0.56 - 0.80) -> deep crypt amber transition
    // Ch 4: Game Arena (0.81 - 1.00) -> stable composed arena camera

    if (progress < 0.25) {
      // Chapter 1: The Cemetery Gates
      const t = progress / 0.25;
      this.targetCameraPos.set(0, 3.5 - t * 0.8, 16 - t * 6);
      this.targetLookAt.set(0, 2.2, 0);
      this.lighting.setChapterProgress(t, 1);
    } else if (progress < 0.55) {
      // Chapter 2: The Crypt Descent
      const t = (progress - 0.25) / 0.3;
      // Tilt camera downward ~35 degrees
      this.targetCameraPos.set(
        Math.sin(t * Math.PI) * 1.5,
        2.7 - t * 1.2,
        10 - t * 12
      );
      this.targetLookAt.set(0, 0.4, -6 - t * 10);
      this.lighting.setChapterProgress(t, 2);
    } else if (progress < 0.80) {
      // Chapter 3: The Altar Entrance
      const t = (progress - 0.55) / 0.25;
      this.targetCameraPos.set(
        -1.2 + t * 2.4,
        1.8 + t * 0.6,
        -2 - t * 16
      );
      this.targetLookAt.set(0, 2.0, -28);
      this.lighting.setChapterProgress(t, 3);
    } else {
      // Chapter 4: Stable composed game arena position
      const t = (progress - 0.80) / 0.20;
      this.targetCameraPos.set(0, 2.4, -22);
      this.targetLookAt.set(0, 2.5, -36);
      this.lighting.setChapterProgress(t, 4);
    }
  }

  animate() {
    if (!this.isRunning) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Smooth camera rig interpolation
    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.cameraTarget.lerp(this.targetLookAt, 0.05);
    this.camera.lookAt(this.cameraTarget);

    // Subsystem updates
    this.lighting.update(delta);
    this.particles.update(delta);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }

  dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
