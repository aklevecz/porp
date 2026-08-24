import { config } from './config.js';

// Port of the MainScreen input model (bundle line 10083). Pointer positions
// are converted from window pixels into the fixed 1900x1200 design space
// (center-relative, y down). After 60 idle frames an auto Lissajous curve
// takes over, blended in/out smoothly with `ratio`.
export class Input {
  constructor() {
    this.userPos = { x: 0, y: 0 };
    this.autoPos = { x: 0, y: 0 };
    this.pos = { x: 0, y: 0 };
    this.autoCount = 100000; // matches original: starts deep in auto mode
    this.count = 0;
    this.ratio = 0;
    this.coverScale = 1; // set by main.js on resize: max(winW/1900, winH/1200)

    window.addEventListener('mousemove', (e) => this.onMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) this.onMove(e.touches[0].clientX, e.touches[0].clientY);
    });
  }

  onMove(clientX, clientY) {
    this.autoCount = 0;
    // window pixels -> design pixels (center-relative)
    this.userPos.x = (clientX - window.innerWidth / 2) / this.coverScale;
    this.userPos.y = (clientY - window.innerHeight / 2) / this.coverScale;
  }

  update() {
    const cfg = config.input;
    this.autoCount++;

    if (this.autoCount > cfg.idleFrames) {
      this.count += cfg.lissajousStep;
      this.autoPos.x = config.design.width * Math.sin(this.count) * cfg.lissajousAmpX;
      this.autoPos.y = config.design.height * Math.cos(2 * this.count) * cfg.lissajousAmpY;
      this.ratio += cfg.ratioRate * (1 - this.ratio);
    } else {
      this.ratio += cfg.ratioRate * (0 - this.ratio);
    }

    this.pos.x = this.userPos.x + (this.autoPos.x - this.userPos.x) * this.ratio;
    this.pos.y = this.userPos.y + (this.autoPos.y - this.userPos.y) * this.ratio;
  }
}
