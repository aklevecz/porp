import * as THREE from 'three';
import { config } from './config.js';

// Exact port of com/fido/utils/Mini3d (bundle line 9735) — the original's
// pseudo-3D projector. Children live in PIXI-style design coordinates
// (y down, origin at design center) and carry position3d / scaleRatio /
// scaleOffset. Each update() projects them onto the 2D view with
//   u = focalLength / (focalLength + rotatedZ)
// and sorts painter-style by depth (-z, far first).
//
// The view is a THREE.Group; the camera flips y (top < bottom), so all
// original y-down math transfers verbatim.
export class Mini3d {
  constructor() {
    this.view = new THREE.Group();
    this.children = [];
    this.focalLength = config.focalLength;
    this.position3d = { x: 0, y: 0, z: 0 };
    this.rotation3d = { x: 0, y: 0, z: 0 };
  }

  addChild(child) {
    if (!child.position3d) child.position3d = { x: 0, y: 0, z: 0 };
    this.view.add(child.mesh);
    this.children.push(child);
  }

  update() {
    const c = Math.sin(this.rotation3d.x), d = Math.cos(this.rotation3d.x);
    const p = Math.sin(this.rotation3d.y), f = Math.cos(this.rotation3d.y);
    const m = Math.sin(this.rotation3d.z), v = Math.cos(this.rotation3d.z);

    for (const y of this.children) {
      let t = y.position3d.x - this.position3d.x;
      let e = y.position3d.y - this.position3d.y;
      const i = y.position3d.z - this.position3d.z;

      const n = d * e - c * i; // rot X
      const o = c * e + d * i;
      const a = f * o - p * t; // rot Y (depth term)
      const s = p * o + f * t;
      const h = v * s - m * n; // rot Z
      const l = m * s + v * n;

      const u = this.focalLength / (this.focalLength + a);
      t = h * u;
      e = l * u;

      y.mesh.scale.x = u * y.scaleRatio * y.scaleOffset.x;
      y.mesh.scale.y = u * y.scaleRatio * y.scaleOffset.y;
      y.depth = -y.position3d.z;
      y.mesh.position.x = t;
      y.mesh.position.y = e;
      // Painter's algorithm: depth ∈ [-range, 0], far (most negative) first.
      // Offset keeps porps above the background (renderOrder 0).
      y.mesh.renderOrder = 10000 + y.depth;
    }
  }
}

// Port of com/nebulon/app/screens/Cloud (line 9762): a textured quad in the
// Mini3d system. Geometry is the texture's natural pixel size (PIXI sprite
// semantics: scale 1 = natural size), anchored at center.
export class Cloud {
  constructor(texture, naturalWidth, naturalHeight, { additive = false } = {}) {
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide, // mirrored (negative-scale) sprites stay visible
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(naturalWidth, naturalHeight), this.material);
    this.position3d = { x: 0, y: 0, z: 0 };
    this.scaleRatio = 2; // Cloud default (line 9770); respawn sets 5
    this.scaleOffset = { x: 1, y: 1 };
    this.depth = 0;
  }

  get alpha() {
    return this.material.opacity;
  }

  set alpha(v) {
    this.material.opacity = Math.max(0, Math.min(1, v));
  }

  get rotation() {
    return this.mesh.rotation.z;
  }

  set rotation(v) {
    this.mesh.rotation.z = v;
  }
}
