// Cart state. Deliberately framework-free: a tiny store that persists to
// localStorage and emits a `change` event. Markup subscribes; nothing here
// knows about the DOM.

const KEY = 'porp.cart.v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // corrupt or unavailable storage: start empty rather than throw
  }
}

// Storage is user-editable and can be stale across a restock, so nothing that
// comes out of it is trusted: sizes must still exist and still be sellable,
// and a quantity of "3" or 999 or NaN must not reach the totals.
function sanitize(lines, product) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    if (!line || typeof line !== 'object') continue;
    const size = String(line.size);
    if (!product.sizes.includes(size)) continue;
    if (product.soldOut.includes(size)) continue;
    if (seen.has(size)) continue;
    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty < 1) continue;
    seen.add(size);
    out.push({ size, qty: Math.min(qty, MAX_PER_SIZE) });
  }
  return out;
}

export const MAX_PER_SIZE = 10;

function write(lines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode / quota: the cart still works for this session.
  }
}

export class Cart extends EventTarget {
  constructor(product) {
    super();
    this.product = product;
    this.lines = sanitize(read(), product);
  }

  #commit() {
    write(this.lines);
    this.dispatchEvent(new CustomEvent('change', { detail: this.snapshot() }));
  }

  // One line per size — adding a size you already have bumps its quantity.
  // Returns how many actually went in, which is 0 once the line is at the cap.
  // The caller needs that: telling someone "Added" when nothing was is a lie.
  add(size, qty = 1) {
    const existing = this.lines.find((l) => l.size === size);
    const before = existing ? existing.qty : 0;
    const after = Math.min(before + qty, MAX_PER_SIZE);
    if (after === before) return 0;
    if (existing) existing.qty = after;
    else this.lines.push({ size, qty: after });
    this.#commit();
    return after - before;
  }

  setQty(size, qty) {
    const line = this.lines.find((l) => l.size === size);
    if (!line) return;
    const next = Math.max(0, Math.min(Math.round(qty), MAX_PER_SIZE));
    if (next === 0) return this.remove(size);
    if (next === line.qty) return;
    line.qty = next;
    this.#commit();
  }

  remove(size) {
    this.lines = this.lines.filter((l) => l.size !== size);
    this.#commit();
  }

  clear() {
    this.lines = [];
    this.#commit();
  }

  get count() {
    return this.lines.reduce((n, l) => n + l.qty, 0);
  }

  get subtotal() {
    return this.lines.reduce((n, l) => n + l.qty * this.product.priceCents, 0);
  }

  snapshot() {
    return {
      lines: this.lines.map((l) => ({ ...l, lineTotal: l.qty * this.product.priceCents })),
      count: this.count,
      subtotal: this.subtotal,
    };
  }
}

export function money(cents) {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}
