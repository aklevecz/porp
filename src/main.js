import * as THREE from 'three';
import { config } from './config.js';
import { CloudsScene } from './scenes/CloudsScene.js';
import { StarsScene } from './scenes/StarsScene.js';
import { MaskyMask } from './objects/MaskyMask.js';
import { Input } from './input.js';
import { RevealMaterial } from './shaders/RevealPass.js';
import { makeSpeedFilter } from './shaders/SpeedFilter.js';

// Three.js port of the deployed PIXI app (javascripts/nebulon_porp.js).
// World = the original's fixed 1900x1200 design space (y down, origin at
// design center), scaled to cover the window like the original stage.
// Pipeline (MainScreen, bundle line 10083):
//   clouds -> RT, stars -> RT, mask -> RT,
//   SuperFilter composite (stars revealed through mask, over clouds) -> screen.
// SpeedFilter exists but is not applied in the deployed build (config.post).

const DESIGN_W = config.design.width;
const DESIGN_H = config.design.height;

// --- Asset loading -----------------------------------------------------------

function loadImageTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        // The design-space camera flips y (top < bottom) so the original's
        // y-down math transfers verbatim; un-flip the textures to compensate.
        texture.flipY = false;
        texture.needsUpdate = true;
        resolve({ texture, width: texture.image.width, height: texture.image.height });
      },
      undefined,
      () => reject(new Error(`Failed to load ${url}`))
    );
  });
}

// Rasterize the SVG at its intrinsic size (792x612), 2x supersampled for
// crispness at large scales. Geometry stays at intrinsic size, matching
// PIXI sprite semantics (scale 1 = natural size).
function loadSvgTexture(url, supersample = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w * supersample;
      canvas.height = h * supersample;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false; // see loadImageTexture: compensates the y-flipped camera
      texture.needsUpdate = true;
      resolve({ texture, width: w, height: h });
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

// --- Boot ---------------------------------------------------------------------

async function init() {
  const container = document.getElementById('container');

  let textures;
  try {
    const urls = [
      config.sky.background,
      config.space.background,
      config.space.sun,
      '/img/isoporp.png',
    ];
    const [sky, space, sun, porpPng, porpSvg] = await Promise.all([
      ...urls.map(loadImageTexture),
      loadSvgTexture('/img/isoporp.svg'),
    ]);
    textures = {
      [config.sky.background]: sky,
      [config.space.background]: space,
      [config.space.sun]: sun,
      '/img/isoporp.png': porpPng,
      '/img/isoporp.svg': porpSvg,
    };
  } catch (e) {
    console.error(e);
    container.innerHTML =
      '<p style="color:#fff;font-family:sans-serif;padding:2rem">Failed to load assets.</p>';
    return;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // The original PIXI pipeline does no color management: raw texels to screen.
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);

  // Design-space camera. top < bottom flips y so all original y-down math
  // (spawn curves, input, mask ring) transfers verbatim.
  const camera = new THREE.OrthographicCamera(-1, 1, -1, 1, -5000, 5000);

  // Fullscreen quad for composite passes.
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeometry = new THREE.PlaneGeometry(2, 2);

  // Scenes (MainScreen ctor order: clouds, stars, maskyMask).
  const clouds = new CloudsScene(textures);
  const stars = new StarsScene(textures);
  const porpSvg = textures['/img/isoporp.svg'];
  const masky = new MaskyMask(porpSvg.texture, porpSvg.width, porpSvg.height);

  // Render targets.
  const rtOpts = { depthBuffer: false };
  let skyRT, spaceRT, maskRT, compositeRT;

  const revealMaterial = RevealMaterial.clone();
  const revealScene = new THREE.Scene();
  revealScene.add(new THREE.Mesh(quadGeometry, revealMaterial));

  const speedMaterial = makeSpeedFilter();
  const speedScene = new THREE.Scene();
  speedScene.add(new THREE.Mesh(quadGeometry, speedMaterial));

  const input = new Input();

  // --- Interactivity (config.interact) -----------------------------------------

  // Click/tap toggles the school open/closed — the original's onDown
  // (bundle line 10095) wired to its never-implemented stubs.
  window.addEventListener('pointerdown', () => {
    if (config.interact.clickToggle) masky.toggle();
  });

  // Mouse wheel: warp boost on flight speed, decaying back to cruise.
  let warp = 1;
  window.addEventListener(
    'wheel',
    (e) => {
      if (!config.interact.scrollWarp) return;
      warp += Math.abs(e.deltaY) * config.interact.warpStep;
      warp = Math.min(warp, config.interact.warpMax);
    },
    { passive: true }
  );

  // --- Cover-fit resize --------------------------------------------------------

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);

    // Scale design space to cover the window (original "safe size" behavior).
    const scale = Math.max(w / DESIGN_W, h / DESIGN_H);
    input.coverScale = scale;
    const vw = w / scale;
    const vh = h / scale;
    camera.left = -vw / 2;
    camera.right = vw / 2;
    camera.top = -vh / 2; // flipped: y down
    camera.bottom = vh / 2;
    camera.updateProjectionMatrix();

    for (const rt of [skyRT, spaceRT, maskRT, compositeRT]) rt?.dispose();
    const pr = renderer.getPixelRatio();
    skyRT = new THREE.WebGLRenderTarget(w * pr, h * pr, rtOpts);
    spaceRT = new THREE.WebGLRenderTarget(w * pr, h * pr, rtOpts);
    maskRT = new THREE.WebGLRenderTarget(w * pr, h * pr, rtOpts);
    compositeRT = new THREE.WebGLRenderTarget(w * pr, h * pr, rtOpts);

    speedMaterial.uniforms.texSize.value.set(vw, vh);
    speedMaterial.uniforms.center.value.set(vw / 2, vh / 2);
  }

  window.addEventListener('resize', resize);
  resize();

  // --- Frame loop (frame-based counters, like the original Ticker) -------------

  function animate() {
    requestAnimationFrame(animate);

    input.update();
    masky.target.x = input.pos.x;
    masky.target.y = input.pos.y;

    // Warp decays back toward cruise speed.
    warp = 1 + (warp - 1) * config.interact.warpDecay;

    clouds.update(warp);
    stars.update(warp);
    masky.update();

    renderer.setRenderTarget(skyRT);
    renderer.clear();
    renderer.render(clouds.scene, camera);

    renderer.setRenderTarget(spaceRT);
    renderer.clear();
    renderer.render(stars.scene, camera);

    renderer.setRenderTarget(maskRT);
    renderer.clear();
    renderer.render(masky.scene, camera);

    revealMaterial.uniforms.tSky.value = skyRT.texture;
    revealMaterial.uniforms.tSpace.value = spaceRT.texture;
    revealMaterial.uniforms.tMask.value = maskRT.texture;

    if (config.post.enabled) {
      renderer.setRenderTarget(compositeRT);
      renderer.clear();
      renderer.render(revealScene, quadCamera);
      speedMaterial.uniforms.uSampler.value = compositeRT.texture;
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(speedScene, quadCamera);
    } else {
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(revealScene, quadCamera);
    }
  }

  animate();
}

init();
