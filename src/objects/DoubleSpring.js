// Verbatim port of com/fido/physics/DoubleSpring (bundle line 9832).
// The original attaches one of these to every mask blob but never drives it —
// we finally put it to work making the school glide after the cursor.
export class DoubleSpring {
  constructor() {
    this.x = 0; this.ax = 0; this.dx = 0; this.tx = 0;
    this.y = 0; this.ay = 0; this.dy = 0; this.ty = 0;
    this.max = 160;
    this.damp = 0.7;
    this.springiness = 0.69;
  }

  update() {
    this.ax = (this.tx - this.x) * this.springiness;
    this.dx += this.ax;
    this.dx *= this.damp;
    if (this.dx < -this.max) this.dx = -this.max;
    else if (this.dx > this.max) this.dx = this.max;
    this.x += this.dx;

    this.ay = (this.ty - this.y) * this.springiness;
    this.dy += this.ay;
    this.dy *= this.damp;
    if (this.dy < -this.max) this.dy = -this.max;
    else if (this.dy > this.max) this.dy = this.max;
    this.y += this.dy;
  }

  setTo(x, y) {
    this.x = this.tx = x;
    this.y = this.ty = y;
    this.dx = this.dy = this.ax = this.ay = 0;
  }
}
