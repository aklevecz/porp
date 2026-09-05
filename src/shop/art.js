// Product artwork, drawn in the brand's own line-art vocabulary: 6px round-cap
// strokes and a 30%-opacity offset shadow, lifted from assets/img/isoporp.svg.
// Everything is inline SVG using currentColor so it inherits the palette.

// The porpoise itself — exact paths from the client's original sticker file.
// `scale` and `x`/`y` place it; `stroke` is the outline weight in porpoise units.
export function porpoise({ x = 0, y = 0, scale = 1, shadow = true } = {}) {
  return `
  <g transform="translate(${x},${y}) scale(${scale})">
    ${shadow ? `
    <path opacity="0.3" fill="currentColor" d="M321.394,184.667c0,0,26.227,52.31,70.611,47.2c0,0-7.926-46.434-59.822-62.249"/>
    <path opacity="0.33" fill="currentColor" d="M192.691,121.903c-2.102-25.895,7.875-49.358,25.023-68.439c10.334-11.498,23.807-19.488,38.812-23.183c29.389-7.236,64.326,1.249,81.35,27.744c14.709,22.896,16.848,48.893,10.951,74.975c-20.607,91.146-181.386,180.291-272.533,2.756c0,0-41.213,10.303-65.783-13.474c0,0,30.119-34.081,64.992-23.778c0,0,32.494-53.102,72.916-55.48c0,0,11.914,41.588-37.25,68.161c0,0,11.338,13.618,40.664,14.947c0,0,20.311-27.884,41.709-27.884"/>` : ''}
    <g fill="var(--paper,#fff)" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-miterlimit="10">
      <path d="M323.394,165.618c0,0,26.227,52.31,70.611,47.2c0,0-7.926-46.434-59.822-62.249"/>
      <path d="M192.691,104.674c-2.102-25.896,7.875-49.358,25.023-68.439c10.334-11.498,23.807-19.488,38.812-23.183c29.389-7.236,64.326,1.249,81.35,27.744c14.709,22.896,16.848,48.893,10.951,74.975c-20.607,91.146-181.386,180.291-272.533,2.756c0,0-41.213,10.303-65.783-13.474c0,0,30.119-34.081,64.992-23.777c0,0,32.494-53.102,72.916-55.48c0,0,11.914,41.588-37.25,68.161c0,0,11.338,13.618,40.664,14.947c0,0,20.311-27.884,41.709-27.884"/>
      <path d="M175.195,165.618c0,0-59.383,36.543-48.287,94.4c0,0,56.273-16.644,64.99-84.013"/>
    </g>
    <circle cx="237.697" cy="80.849" r="6.755" fill="currentColor"/>
    <circle cx="320.879" cy="82.643" r="6.755" fill="currentColor"/>
    <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-miterlimit="10">
      <path d="M240.862,105.75c0,0,20.158,8.417,38.748-8.346c0,0,19.535,16.269,37.68,10.14"/>
      <path d="M265.036,123.354c0,0,11.426,11.27,27.76,0.51"/>
      <line x1="145.591" y1="122.885" x2="151.833" y2="108.903"/>
    </g>
  </g>`;
}

// Shared crop-hoodie silhouette. Flat-lay, front-on: hood up top, body cut
// short above the waist, ribbed cuffs and hem.
function garmentBody() {
  return `
    <path fill="var(--paper,#fff)" d="
      M320,228
      C300,231 282,238 262,250
      C218,316 172,378 134,450
      C130,458 133,467 141,471
      L195,499
      C203,503 213,500 217,492
      C236,458 258,428 280,404
      C276,424 274,442 276,458
      L524,458
      C526,442 524,424 520,404
      C542,428 564,458 583,492
      C587,500 597,503 605,499
      L659,471
      C667,467 670,458 666,450
      C628,378 582,316 538,250
      C518,238 500,231 480,228
      C472,258 448,272 400,272
      C352,272 328,258 320,228
      Z"/>
    <path d="M277,430 L523,430"/>
    <path d="M150,444 L208,474"/>
    <path d="M650,444 L592,474"/>`;
}

// The hood: an outer dome over the shoulders. From the front you also see the
// inner edge of the opening, which is what stops it reading as a bonnet; from
// behind you see the outside of the hood and a seam, and no opening at all —
// which is the difference that tells the two views apart at a glance.
function hood({ open = true } = {}) {
  return `
    <path fill="var(--paper,#fff)" d="M314,230 C302,144 344,110 400,110 C456,110 498,144 486,230"/>
    ${open
      ? '<path d="M349,236 C341,182 367,158 400,158 C433,158 459,182 451,236"/>'
      : '<path d="M400,110 L400,230"/>'}`;
}

// Drawstrings, out of the front edge of the hood opening.
function drawstrings() {
  return `
    <path d="M381,268 C379,288 377,300 376,312"/>
    <path d="M419,268 C421,288 423,300 424,312"/>`;
}

const STROKE = 'fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"';

// Front: hood, drawstrings, and the porpoise across the chest.
export const FRONT = `
<svg viewBox="0 0 800 760" role="img" aria-label="Front of the crop hoodie: the porpoise printed across the chest">
  <g ${STROKE}>
    ${hood()}
    ${garmentBody()}
    ${drawstrings()}
  </g>
  ${porpoise({ x: 330, y: 322, scale: 0.35 })}
</svg>`;

// Back: the hood from behind, and the porpoise small between the shoulders.
export const BACK = `
<svg viewBox="0 0 800 760" role="img" aria-label="Back of the crop hoodie: the hood from behind, with a small porpoise between the shoulders">
  <g ${STROKE}>
    ${hood({ open: false })}
    ${garmentBody()}
  </g>
  ${porpoise({ x: 362, y: 316, scale: 0.19, shadow: false })}
</svg>`;

// Detail: the chest print at scale. Nothing behind it — an earlier version had
// ruled "stitch" hairlines, which encoded nothing and read as newsprint.
export const DETAIL = `
<svg viewBox="0 0 800 760" role="img" aria-label="Close-up of the chest print">
  ${porpoise({ x: 130, y: 190, scale: 1.12 })}
</svg>`;

// The hang tag — the porpoise over the brand line, punched and strung.
export const TAG = `
<svg viewBox="0 0 800 760" role="img" aria-label="The hang tag: the porpoise above the words you have no porpoise">
  <g ${STROKE}>
    <path d="M400,96 C332,152 300,186 300,240"/>
    <path fill="var(--paper,#fff)" d="M262,196 h276 c14,0 24,10 24,24 v344 c0,14 -10,24 -24,24 h-276 c-14,0 -24,-10 -24,-24 v-344 c0,-14 10,-24 24,-24 z"/>
    <circle cx="300" cy="240" r="15"/>
    <path d="M262,470 h276" stroke-width="6"/>
  </g>
  ${porpoise({ x: 292, y: 268, scale: 0.5, shadow: false })}
  <g fill="currentColor" text-anchor="middle"
     style="font-family:var(--display,system-ui);font-weight:900;letter-spacing:0.08em">
    <text x="400" y="512" font-size="30">YOU HAVE</text>
    <text x="400" y="548" font-size="30">NO PORPOISE</text>
  </g>
</svg>`;

// The garment as a solid silhouette, for the cart line. A stroked drawing
// cannot survive a 72px thumb — the page's 3px pen is proportionally four
// times too heavy there — but a filled shape can, and a Paper-on-Ink
// silhouette is already how the porpoise reads in the client's own file.
export const GARMENT_MARK = `
<svg viewBox="124 100 552 409" aria-hidden="true" focusable="false">
  <g fill="currentColor">
    <path d="M314,230 C302,144 344,110 400,110 C456,110 498,144 486,230 Z"/>
    <path d="
      M320,228
      C300,231 282,238 262,250
      C218,316 172,378 134,450
      C130,458 133,467 141,471
      L195,499
      C203,503 213,500 217,492
      C236,458 258,428 280,404
      C276,424 274,442 276,458
      L524,458
      C526,442 524,424 520,404
      C542,428 564,458 583,492
      C587,500 597,503 605,499
      L659,471
      C667,467 670,458 666,450
      C628,378 582,316 538,250
      C518,238 500,231 480,228
      C472,258 448,272 400,272
      C352,272 328,258 320,228
      Z"/>
  </g>
  <!-- the hood opening, punched back out so it still reads as a hood -->
  <path fill="var(--paper,#fff)" d="M349,236 C341,182 367,158 400,158 C433,158 459,182 451,236 Z"/>
</svg>`;

export const VIEWS = [
  { id: 'front', label: 'Front', svg: FRONT },
  { id: 'detail', label: 'The chest print', svg: DETAIL },
  { id: 'back', label: 'Back', svg: BACK },
  { id: 'tag', label: 'The tag', svg: TAG },
];

// The drawing's own bounds, stroke included — so the mark can be placed by its
// edges rather than floating in isoporp.svg's oversized 792x612 canvas.
const CROP = '6 8 392 258';

// The hero sticker: keeps its native shadow paths, scales naturally so the
// 6-unit pen lands at ~3px when the sticker is drawn 196px wide.
export const STICKER = `
<svg viewBox="${CROP}" aria-hidden="true" focusable="false">${porpoise()}</svg>`;

// The closing silhouette. On the Ink field its Ink strokes vanish into the
// ground and only the Paper body survives — which is exactly how the porpoise
// reads inside the client's own porp_font.svg.
export const SILHOUETTE = `
<svg viewBox="${CROP}" aria-hidden="true" focusable="false">${porpoise({ shadow: false })}</svg>`;

// Small utility mark: cart line-item thumbs and the empty state. Stroke weight
// is pinned in CSS so it never thins to a hairline at 72px.
export const MARK = `
<svg viewBox="${CROP}" class="mark" aria-hidden="true" focusable="false">${porpoise({ shadow: false })}</svg>`;
