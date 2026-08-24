import * as THREE from 'three';

// Custom shader that blends sky (front) and space (back) using a mask texture.
// Where mask is bright → show space scene. Where mask is dark → show sky scene.
// This replicates the original SuperFilter behavior.
export const RevealMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tSky: { value: null },
    tSpace: { value: null },
    tMask: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tSky;
    uniform sampler2D tSpace;
    uniform sampler2D tMask;
    varying vec2 vUv;

    void main() {
      vec4 maskColor = texture2D(tMask, vUv);
      float strength = maskColor.r * maskColor.a;
      strength *= 5.0;
      strength = min(1.0, strength);

      vec4 skyColor = texture2D(tSky, vUv);
      // Slight UV distortion on space layer where mask fades (matches original)
      vec4 spaceColor = texture2D(tSpace, vUv + (1.0 - strength) * 0.1);

      // Sky is default, porps reveal space underneath
      gl_FragColor = mix(skyColor, spaceColor, strength);
    }
  `,
  depthTest: false,
  depthWrite: false,
});
