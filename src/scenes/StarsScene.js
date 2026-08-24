import * as THREE from 'three';
import { Mini3d, Cloud } from '../Mini3d.js';
import { config } from '../config.js';

const rand = (a, b) => a + Math.random() * (b - a);

// Port of com/nebulon/app/screens/Stars (bundle line 9810) — the space layer:
// a slowly rotating 1900x1900 space disc, 30 additive porps drifting in from
// deep space, and the sun banner drawn on top at the design top-left.
export class StarsScene {
  constructor(textures) {
    const cfg = config.space;
    this.cfg = cfg;
    this.scene = new THREE.Scene();
    this.count = 0;

    // Background: anchor .5 at design center, scale 1.185, rotates slowly.
    const bg = textures[cfg.background];
    this.bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(bg.width, bg.height),
      new THREE.MeshBasicMaterial({ map: bg.texture, depthTest: false, depthWrite: false, side: THREE.DoubleSide })
    );
    this.bgMesh.scale.set(cfg.bgScale, cfg.bgScale, 1);
    this.bgMesh.renderOrder = 0;
    this.scene.add(this.bgMesh);

    this.mini3d = new Mini3d();
    this.scene.add(this.mini3d.view);

    this.clouds = [];
    for (let e = 0; e < cfg.count; e++) {
      const src = textures[cfg.images[e % cfg.images.length]];
      const cloud = new Cloud(src.texture, src.width, src.height, { additive: cfg.additive });
      cloud.alpha = 0;
      cloud.rotSpeed = cfg.initialRotSpeed; // wild spin until first respawn, as shipped
      cloud.position3d.z = -(cfg.range / cfg.count) * e;
      this.mini3d.addChild(cloud);
      this.clouds.push(cloud);
    }

    // Sun: added after the porps → renders above them. Original leaves it at
    // (0,0) with a top-left anchor and normal blending.
    const sun = textures[cfg.sun];
    this.sunMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(sun.width, sun.height),
      new THREE.MeshBasicMaterial({ map: sun.texture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide })
    );
    // Center-relative position of a top-left-anchored sprite at (0,0):
    this.sunMesh.position.set(
      -config.design.width / 2 + sun.width / 2,
      -config.design.height / 2 + sun.height / 2,
      0
    );
    this.sunMesh.renderOrder = 20000;
    this.scene.add(this.sunMesh);
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
      e.rotation += e.rotSpeed;
      if (e.position3d.z < 0) {
        e.scaleRatio = cfg.respawnScaleRatio;
        e.rotSpeed = rand(-cfg.rotSpeedRange, cfg.rotSpeedRange);
        e.position3d.z += cfg.range;
        e.position3d.x = rand(-cfg.spawnX, cfg.spawnX);
        e.position3d.y = rand(-cfg.spawnY, cfg.spawnY);
        e.alpha = 0;
        e.rotation = 0;
        e.scaleOffset.x = rand(cfg.scaleOffsetX[0], cfg.scaleOffsetX[1]);
        e.scaleOffset.y = rand(cfg.scaleOffsetY[0], cfg.scaleOffsetY[1]);
        if (Math.random() < 0.5) e.scaleOffset.x *= -1;
      }
    }

    this.mini3d.update();
    this.count += cfg.countStep;
    this.bgMesh.rotation.z += cfg.bgRotationStep;
    const osc = config.oscillator;
    this.mini3d.view.rotation.z = osc.rollAmp * Math.cos(osc.rollFreq * this.count);
    this.mini3d.position3d.y = osc.bobAmp * Math.sin(osc.bobFreq * this.count) + osc.bobOffset;
    this.mini3d.rotation3d.y = osc.yawAmp * Math.sin(osc.yawFreq * this.count);
  }
}
