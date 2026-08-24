import * as THREE from 'three';
import { config } from '../config.js';
import { DoubleSpring } from './DoubleSpring.js';

// Port of com/nebulon/app/screens/MaskyMask (bundle line 9841): 50 porpoise
// sprites at natural SVG size (792x612) pulsing with a signed sine — scale
// runs -1..1, so each blob shrinks through zero and re-emerges mirrored.
// Every 2π of its phase a blob draws a new slot on a ring around the cursor
// target (the teleport is invisible because scale crosses zero right then).
//
// Interactivity added on top (config.interact):
// - springFollow: each blob glides toward its ring slot through the
//   DoubleSpring the original shipped on every blob but never drove.
// - open()/close(): the original's empty stubs, implemented — the ring
//   offsets scale up and the school blooms apart, click again to close.
export class MaskyMask {
  constructor(porpTexture, naturalWidth, naturalHeight) {
    const cfg = config.mask;
    this.cfg = cfg;
    this.scene = new THREE.Scene();
    this.target = { x: 0, y: 0 };
    this.blobs = [];
    this.isOpen = false;
    this.ringScale = 1;

    const geometry = new THREE.PlaneGeometry(naturalWidth, naturalHeight);
    for (let e = 0; e < cfg.count; e++) {
      const material = new THREE.MeshBasicMaterial({
        map: porpTexture,
        transparent: true,
        opacity: cfg.alpha,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide, // survives the negative-scale half of the pulse
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(0.0001, 0.0001, 1);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const radius = cfg.spawnRadius[0] + Math.random() * (cfg.spawnRadius[1] - cfg.spawnRadius[0]);
      this.blobs.push({
        mesh,
        spring: new DoubleSpring(),
        offsetX: Math.sin(angle) * radius,
        offsetY: Math.cos(angle) * radius,
        rotationSpeed: (Math.random() - 0.5) * 2 * cfg.rotationSpeedRange, // ±0.1
        count: Math.random() * Math.PI * 2,
      });
    }
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  update() {
    const cfg = this.cfg;
    const interact = config.interact;

    const targetRing = this.isOpen && interact.clickToggle ? interact.openRingScale : 1;
    this.ringScale += interact.ringScaleRate * (targetRing - this.ringScale);

    for (const e of this.blobs) {
      e.count += cfg.countStep;
      const i = Math.sin(cfg.pulseFreq * e.count); // signed: mirrors through zero

      e.mesh.scale.x = e.mesh.scale.y = i === 0 ? 0.0001 : i;
      e.mesh.rotation.z += 0.1 * e.rotationSpeed;
      e.mesh.material.opacity = cfg.alpha;

      if (e.count > 2 * Math.PI) {
        e.count -= 2 * Math.PI;
        const angle = Math.random() * Math.PI * 2;
        const radius = cfg.spawnRadius[0] + Math.random() * (cfg.spawnRadius[1] - cfg.spawnRadius[0]);
        e.offsetX = Math.sin(angle) * radius;
        e.offsetY = Math.cos(angle) * radius;
        e.mesh.rotation.z = Math.random() * Math.PI * 2;
        if (!interact.springFollow) {
          // Original behavior: teleport, hidden by the zero-scale moment.
          e.mesh.position.x = this.target.x + e.offsetX * this.ringScale;
          e.mesh.position.y = this.target.y + e.offsetY * this.ringScale;
        }
      }

      if (interact.springFollow) {
        e.spring.tx = this.target.x + e.offsetX * this.ringScale;
        e.spring.ty = this.target.y + e.offsetY * this.ringScale;
        e.spring.update();
        e.mesh.position.x = e.spring.x;
        e.mesh.position.y = e.spring.y;
      }
    }
  }
}
