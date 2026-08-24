import * as THREE from 'three';
import { config } from '../config.js';

// Verbatim port of com/nebulon/app/screens/SpeedFilter (bundle line 9916):
// dithered 20-tap radial blur toward center, vignette-gated blur mix,
// chromatic-aberration shift, and edge saturation. NOTE: the deployed build
// constructs this filter but never applies it — config.post.enabled is false
// by default to match. Enable it in config.js to see it.
export function makeSpeedFilter() {
  const p = config.post;
  return new THREE.ShaderMaterial({
    uniforms: {
      uSampler: { value: null },
      center: { value: new THREE.Vector2(config.design.width / 2, config.design.height / 2) },
      strength: { value: p.blurStrength },
      texSize: { value: new THREE.Vector2(config.design.width, config.design.height) },
      vignetteOffset: { value: p.vignetteOffset },
      vignetteDarkness: { value: p.vignetteDarkness },
      red: { value: new THREE.Vector2(p.red[0], p.red[1]) },
      green: { value: new THREE.Vector2(p.green[0], p.green[1]) },
      blue: { value: new THREE.Vector2(p.blue[0], p.blue[1]) },
      saturation: { value: p.saturation },
      saturationConstant: { value: p.saturationConstant },
    },
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vTextureCoord;
      void main() {
        vTextureCoord = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uSampler;
      varying vec2 vTextureCoord;
      uniform vec2 center;
      uniform float strength;
      uniform vec2 texSize;
      uniform float vignetteOffset;
      uniform float vignetteDarkness;
      uniform vec2 red;
      uniform vec2 green;
      uniform vec2 blue;
      uniform float saturation;
      uniform float saturationConstant;

      float random(vec3 scale, float seed) {
        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
      }
      vec3 czm_saturation(vec3 rgb, float adjustment) {
        const vec3 W = vec3(0.2125, 0.7154, 0.0721);
        vec3 intensity = vec3(dot(rgb, W));
        return mix(intensity, rgb, adjustment);
      }

      void main() {
        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 toCenter = center - vTextureCoord * texSize;
        vec4 actual = texture2D(uSampler, vTextureCoord);
        float dist = distance(vTextureCoord, vec2(0.5));
        float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
        for (float t = 0.0; t <= 20.0; t++) {
          float percent = (t + offset) / 20.0;
          float weight = 4.0 * (percent - percent * percent);
          vec4 samp = texture2D(uSampler, vTextureCoord + toCenter * percent * strength / texSize);
          samp.rgb *= samp.a;
          color += samp * weight;
          total += weight;
        }
        color = color / total;
        float mixBlur = 0.08;
        float distMix = smoothstep(0.8, vignetteDarkness * 0.799, dist * (vignetteOffset + vignetteDarkness));
        gl_FragColor = mix(color, actual, max(mixBlur, distMix));
        vec4 shift;
        float distMixInv = 1.0 - distMix;
        shift.r = texture2D(uSampler, vTextureCoord + (red * distMixInv) / texSize.xy).r;
        shift.g = texture2D(uSampler, vTextureCoord + (green * distMixInv) / texSize.xy).g;
        shift.b = texture2D(uSampler, vTextureCoord + (blue * distMixInv) / texSize.xy).b;
        shift.a = texture2D(uSampler, vTextureCoord).a;
        gl_FragColor = mix(gl_FragColor, shift, 0.3);
        float feather = 0.005;
        float satMix = 1.0 - smoothstep(0.5, feather * 0.499, dist * (1.2 + feather));
        satMix *= saturationConstant;
        gl_FragColor.rgb = czm_saturation(gl_FragColor.rgb, max(saturation * (satMix + 1.0), 1.0));
        gl_FragColor.rgb /= gl_FragColor.a + 0.00001;
      }
    `,
  });
}
