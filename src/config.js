// Every constant extracted from the original bundle (javascripts/nebulon_porp.js).
// Line numbers reference the beautified bundle. Change values here to retune the
// piece — nothing below is invented; defaults replicate the deployed site.

export const config = {
  // APP_root (line 10122): fixed design space, scaled to cover the window.
  design: { width: 1900, height: 1200 },

  // Renderer. The original used full devicePixelRatio; cap is a perf knob.
  maxPixelRatio: 2,

  // Mini3d (line 9735)
  focalLength: 400,

  // Clouds — the night-sky scene (line 9788)
  sky: {
    background: '/img/skyBG.jpg', // 1900x1200, top-left, unscaled
    count: 50,
    images: ['/img/isoporp.svg', '/img/isoporp.png'], // alternating (e % 2)
    speed: -15,
    range: 3000,
    spawnX: 4500, // x in ±4500
    // y = 1200 - |0.2 x| + rand(0, 200)  (center-relative, y down)
    spawnYBase: 1200,
    spawnYSlope: 0.2,
    spawnYJitter: 200,
    tiltPerX: -2e-4, // rotation = x * tiltPerX on respawn
    respawnScaleRatio: 5,
    scaleOffsetX: [0.6, 1.4], // 50% chance x *= -1 (mirror)
    scaleOffsetY: [0.9, 1.1],
    fadeNear: 300, // alpha = z/300 when z < 300
    fadeInRate: 0.01, // alpha += rate * (1 - alpha)
    countStep: 1, // this.count++ per frame
  },

  // Stars — the space scene (line 9810)
  space: {
    background: '/img/spaceBG.jpg', // 1900x1900, anchor .5 at (950,600)
    bgScale: 1.185,
    bgRotationStep: 2e-4, // per frame
    sun: '/img/sun_add.png', // 1141x299, top-left corner, normal blend, above porps
    count: 30,
    images: ['/img/isoporp.svg', '/img/isoporp.svg', '/img/isoporp.svg'],
    additive: true, // BLEND_MODES.SCREEN on porps
    speed: -5,
    range: 2000,
    spawnX: 4950, // x in ±4950
    spawnY: 4950, // y in ±4950 (no ground curve)
    initialRotSpeed: 4, // brief wild spin until first respawn (yes, really)
    rotSpeedRange: 5e-4, // respawn rotSpeed in ±5e-4
    respawnScaleRatio: 5,
    scaleOffsetX: [1, 1.2], // 50% chance x *= -1
    scaleOffsetY: [1, 1.2],
    fadeNear: 300,
    fadeInRate: 0.01,
    countStep: 0.25,
  },

  // Shared view oscillators (both scenes, lines 9806 / 9829):
  //   roll  = 0.08 * cos(0.02 t)
  //   ybob  = 200 * sin(0.03 t) - 50
  //   yaw   = 0.2 * sin(0.02 t * 0.5)
  oscillator: {
    rollAmp: 0.08, rollFreq: 0.02,
    bobAmp: 200, bobFreq: 0.03, bobOffset: -50,
    yawAmp: 0.2, yawFreq: 0.01,
  },

  // MaskyMask (line 9841)
  mask: {
    count: 50,
    image: '/img/isoporp.svg',
    countStep: 0.1, // per-blob phase step
    pulseFreq: 0.5, // scale = sin(pulseFreq * count), signed
    rotationSpeedRange: 0.1, // per-blob in ±0.1; rotation += 0.1 * rotationSpeed
    alpha: 0.9,
    spawnRadius: [100, 200], // ring around target on each 2π cycle
  },

  // MainScreen input (line 10083)
  input: {
    idleFrames: 60, // auto mode after this many frames without input
    lissajousStep: 0.01, // t += step; x = W sin(t) 0.25, y = H cos(2t) 0.05
    lissajousAmpX: 0.25,
    lissajousAmpY: 0.05,
    ratioRate: 0.1, // ratio += rate * (target - ratio)
  },

  // SuperFilter (line 9878)
  reveal: {
    maskGain: 5.0, // strength = min(1, mask.r * mask.a * gain)
    distort: 0.1, // space UV += (1 - strength) * distort
  },

  // Interactivity beyond the deployed build. Each piece is rooted in the
  // original's own unfinished material: onDown toggled empty open()/close()
  // stubs (line 10095), and every mask blob carries a DoubleSpring the
  // original never drives (line 9848). Set any flag false for the strictly
  // faithful behavior.
  interact: {
    // Click/tap: the school blooms open (ring offsets scaled up), click again
    // to snap it back tight. Implements the original's open()/close() stubs.
    clickToggle: true,
    openRingScale: 4.5, // how far the school spreads when open
    ringScaleRate: 0.08, // per-frame easing of the ring scale

    // Blobs glide toward their ring slot around the cursor through their
    // DoubleSpring (original constants: springiness .69, damp .7, max 160)
    // instead of sitting still between respawns.
    springFollow: true,

    // Mouse wheel: temporary warp — flight speed multiplies up, then decays
    // back to cruise.
    scrollWarp: true,
    warpStep: 0.0015, // warp gained per wheel-delta unit
    warpMax: 4, // speed multiplier ceiling
    warpDecay: 0.985, // per-frame decay of the boost back toward 1
  },

  // SpeedFilter (line 9916) — constructed but NEVER applied in the deployed
  // build, so it is off by default. Flip `enabled` to see it.
  post: {
    enabled: false,
    blurStrength: 0.15,
    vignetteOffset: 0.96,
    vignetteDarkness: 0.0,
    red: [20, 0],
    green: [0, 10],
    blue: [-30, 5],
    saturation: 0.0,
    saturationConstant: 0.0,
  },
};
