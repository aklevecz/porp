import * as THREE from 'three';
import { Mini3d, Cloud } from '../Mini3d.js';
import { config } from '../config.js';

const rand = (a, b) => a + Math.random() * (b - a);

// Port of com/nebulon/app/screens/Clouds (bundle line 9788) — the night-sky
// layer: skyBG plus 50 porps streaming toward the camera over a perspective
// ground curve, alternating SVG/PNG textures.
export class CloudsScene {
  // `textures` = { url: { texture, width, height } } preloaded by main.js
  constructor(textures) {
    const cfg = config.sky;
    this.cfg = cfg;
    this.scene = new THREE.Scene();
    this.count = 0;

    // Background: 1900x1200 at the design top-left (center-relative origin).
    const bg = textures[cfg.background];
    this.bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(config.design.width, config.design.height),
      new THREE.MeshBasicMaterial({ map: bg.texture, depthTest: false, depthWrite: false, side: THREE.DoubleSide })
    );
    this.bgMesh.renderOrder = 0;
    this.scene.add(this.bgMesh);

    // Mini3d view sits at design center (original: view.x = w/2, y = h/2).
    this.mini3d = new Mini3d();
    this.scene.add(this.mini3d.view);

    this.clouds = [];
    for (let e = 0; e < cfg.count; e++) {
      const src = textures[cfg.images[e % cfg.images.length]];
      const cloud = new Cloud(src.texture, src.width, src.height);
      cloud.alpha = 0;
      cloud.position3d.z = -(cfg.range / cfg.count) * e; // negative → respawns on frame 1
      this.mini3d.addChild(cloud);
      this.clouds.push(cloud);
    }
  }

  update(warp = 1) {
    const cfg = this.cfg;
    for (const e of this.clouds) {
      e.position3d.z += cfg.speed * warp;
      if (e.position3d.z < cfg.fadeNear) {
        e.alpha = e.position3d.z / cfg.fadeNear;
      } else {
        e.alpha += cfg.fadeInRate * (1 - e.alpha);
      }
      if (e.position3d.z < 0) {
        e.scaleRatio = cfg.respawnScaleRatio;
        e.position3d.z += cfg.range;
        e.position3d.x = rand(-cfg.spawnX, cfg.spawnX);
        e.position3d.y = cfg.spawnYBase - Math.abs(cfg.spawnYSlope * e.position3d.x) + rand(0, cfg.spawnYJitter);
        e.rotation = e.position3d.x * cfg.tiltPerX;
        e.alpha = 0;
        e.scaleOffset.x = rand(cfg.scaleOffsetX[0], cfg.scaleOffsetX[1]);
        e.scaleOffset.y = rand(cfg.scaleOffsetY[0], cfg.scaleOffsetY[1]);
        if (Math.random() < 0.5) e.scaleOffset.x *= -1;
      }
    }

    this.mini3d.update();
    this.count += cfg.countStep;
    const osc = config.oscillator;
    this.mini3d.view.rotation.z = osc.rollAmp * Math.cos(osc.rollFreq * this.count);
    this.mini3d.position3d.y = osc.bobAmp * Math.sin(osc.bobFreq * this.count) + osc.bobOffset;
    this.mini3d.rotation3d.y = osc.yawAmp * Math.sin(osc.yawFreq * this.count);
  }
}
