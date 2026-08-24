import { PRODUCT } from './product.js';
import { Cart, money, MAX_PER_SIZE } from './cart.js';
import { isConfigured, checkoutUrl } from './checkout.js';
import { MARK } from './art.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const PHRASE = 'YOU HAVE NO PORPOISE';
const cart = new Cart(PRODUCT);

let selectedSize = null;
let qty = 1;
let lastRemoved = null;
let opener = null;

/* Every static region — the drawings, the size guide, the shipping table, the
   questions, the size chips — is prerendered into index.html at build and dev
   time by the porp-prerender plugin in vite.config.js, from src/shop/render.js.
   So the page is complete without JavaScript, and nothing below re-renders it. */

/* ── the field ───────────────────────────────────────────────────────────
   The client fitted the phrase to their 782 square with equal 38px margins —
   90.3% of the width. Reproduce that fit font-agnostically by measuring the
   phrase's own em-width, so the ratio belongs to the file and not to Outfit. */

const field = $('.field');
const rowBox = $('[data-rows]');

function fitField() {
  // Measure a real .field__row so the ratio always reflects the stylesheet —
  // a hardcoded copy of the tracking here would silently drift out of sync.
  const probe = document.createElement('span');
  probe.className = 'field__row';
  probe.textContent = PHRASE;
  probe.style.cssText = 'position:absolute;visibility:hidden;font-size:100px;';
  rowBox.appendChild(probe);
  const ratio = probe.getBoundingClientRect().width / 100;
  probe.remove();

  // Only judge the calibration once the real face is in — the first pass runs
  // against the fallback and would otherwise cry wolf on every single load.
  const displayReady = document.fonts?.check('900 100px Outfit') ?? true;
  if (displayReady && (ratio < 14.2 || ratio > 15.0)) {
    console.warn(
      `[field] phrase measures ${ratio.toFixed(2)}em; the client's file is 14.64em. ` +
      `Adjust word-spacing (never letter-spacing) to bring it into 14.2–15.0, ` +
      `and re-check the word gap against the file's 0.3956em.`
    );
  }
  field.style.setProperty('--field-fs', `${(field.clientWidth * 0.903) / ratio}px`);
}

function buildRows() {
  const probe = document.createElement('span');
  probe.className = 'field__row';
  probe.textContent = PHRASE;
  rowBox.replaceChildren(probe);
  const pitch = probe.getBoundingClientRect().height || 1;
  document.documentElement.style.setProperty('--pitch', `${pitch}px`);

  const need = Math.ceil(field.clientHeight / pitch) + 2;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < need; i++) {
    const row = document.createElement('span');
    row.className = 'field__row';
    row.textContent = PHRASE;
    frag.appendChild(row);
  }
  rowBox.replaceChildren(frag);
  return pitch;
}

/* THE SIGNATURE. For every knocked-out block, delete the field row that would
   pass through its centre — leaving a clear Ink band bisecting the block and
   running out into the margins on both sides. Which is precisely what
   porp_font.svg does at its seventh line, where one row is removed so the
   porpoise can sit there. */
function cutRows(pitch) {
  const rows = $$('.field__row', rowBox);
  rows.forEach((r) => r.removeAttribute('data-cut'));
  const fieldTop = field.getBoundingClientRect().top + scrollY;

  for (const block of $$('[data-block]')) {
    const b = block.getBoundingClientRect();
    const centre = b.top + scrollY + b.height / 2 - fieldTop;
    const i = Math.round((centre - pitch / 2) / pitch);
    rows[i]?.setAttribute('data-cut', '');
  }
}

function layoutField() {
  fitField();
  cutRows(buildRows());
}

/* ── press parity ────────────────────────────────────────────────────────
   :active never fires for a keyboard Enter, so a press class carries the
   state for both input methods. */
function pressParity() {
  const sel = '.cta,.chip,.stepper__btn,.close,.cartbtn';
  document.addEventListener('pointerdown', (e) => e.target.closest(sel)?.classList.add('is-pressed'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') e.target.closest?.(sel)?.classList.add('is-pressed');
  });
  for (const ev of ['pointerup', 'pointercancel', 'keyup', 'blur']) {
    document.addEventListener(ev, () => $$('.is-pressed').forEach((n) => n.classList.remove('is-pressed')), true);
  }
}

/* ── size ────────────────────────────────────────────────────────────── */

// Written synchronously. An earlier version deferred this to requestAnimationFrame
// to force a change event, but rAF is throttled in background tabs — the
// announcement could simply never arrive. Repeating a message is instead made
// distinct with a trailing no-break space, which reads as nothing.
function announce(msg) {
  const region = $('[data-status]');
  region.textContent = region.textContent.trimEnd() === msg ? `${msg} ` : msg;
}

function clearSizeError() {
  $('[data-size-error-slot]').innerHTML = '';
  $('.sizes').removeAttribute('aria-describedby');
}

function selectSize(size) {
  selectedSize = size;
  for (const chip of $$('.chip')) {
    const on = chip.dataset.size === size;
    chip.setAttribute('aria-checked', String(on));
    chip.tabIndex = on ? 0 : -1;
  }
  $('[data-sticky-size]').textContent = `Size ${size}`;
  clearSizeError();
}

function initSizes() {
  const chips = $$('.chip');
  $('[data-sizes]').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    if (chip.getAttribute('aria-disabled') === 'true') {
      announce(`${chip.dataset.size} is sold out. We restock when we restock.`);
      return;
    }
    selectSize(chip.dataset.size);
  });

  $('[data-sizes]').addEventListener('keydown', (e) => {
    const i = chips.indexOf(e.target);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % chips.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + chips.length) % chips.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = chips.length - 1;
    else return;
    e.preventDefault();
    const chip = chips[next];
    chip.focus();
    if (chip.getAttribute('aria-disabled') !== 'true') {
      selectSize(chip.dataset.size);   // owns the tab stop: it follows selection
    }
    // Landing on a sold-out chip selects nothing, so the group's single tab
    // stop stays with the chosen size rather than stranding on a dead option.
  });
}

/* ── quantity ────────────────────────────────────────────────────────── */

// `silent` is used by the post-add reset, which must not clobber the "Added…"
// message sitting in the live region.
function setQty(n, { silent = false } = {}) {
  qty = Math.max(1, Math.min(MAX_PER_SIZE, n));
  const dec = $('[data-qty-dec]');
  const inc = $('[data-qty-inc]');
  $('[data-qty]').textContent = String(qty);
  dec.disabled = qty <= 1;
  inc.disabled = qty >= MAX_PER_SIZE;
  // Stepping to an end disables the button you are standing on, which would
  // drop focus to <body> mid-interaction. Hand it to the other one instead.
  if (document.activeElement === dec && dec.disabled) inc.focus();
  else if (document.activeElement === inc && inc.disabled) dec.focus();
  if (!silent) announce(`Quantity ${qty}`);
}

/* ── cart ────────────────────────────────────────────────────────────── */

function addToCart() {
  if (!selectedSize) {
    $('[data-size-error-slot]').innerHTML =
      '<p class="sizeerr" id="size-error" role="alert">Pick a size first.</p>';
    $('.sizes').setAttribute('aria-describedby', 'size-error');
    const first = $$('.chip').find((c) => c.getAttribute('aria-disabled') !== 'true');
    first?.focus();
    return;
  }
  const added = cart.add(selectedSize, qty);
  const n = cart.count;
  if (!added) {
    // The line is already at the cap. Saying "Added" here would be a lie.
    announce(`Already ${MAX_PER_SIZE} of size ${selectedSize} in the cart, which is the most we sell at once.`);
    openCart();
    return;
  }
  announce(`Added. ${PRODUCT.name}, size ${selectedSize}. Cart: ${n} item${n === 1 ? '' : 's'}.`);
  // Back to one: the next add is a fresh intent, and silently carrying the
  // last quantity onto a different size is how people end up with two larges
  // they never asked for. Quantities are edited in the cart from here.
  setQty(1, { silent: true });
  openCart();
}

// Re-rendering the drawer body destroys whatever button focus is standing on,
// which inside an aria-modal dialog drops focus to <body> and strands keyboard
// and screen-reader users outside the dialog. So: note what had focus by a
// stable key, and put focus back on its replacement afterwards.
function focusKey(el) {
  if (!el || !el.dataset) return null;
  for (const k of ['lineDec', 'lineInc', 'lineRemove', 'undoGo', 'checkoutGo']) {
    if (k in el.dataset) return `${k}:${el.dataset[k]}`;
  }
  return null;
}

function restoreFocus(key, fallbackSize) {
  if (!key) return;
  const [k, val] = key.split(':');
  const attr = { lineDec: 'data-line-dec', lineInc: 'data-line-inc', lineRemove: 'data-line-remove',
    undoGo: 'data-undo-go', checkoutGo: 'data-checkout-go' }[k];
  let el = val ? $(`[${attr}="${val}"]`, drawer) : $(`[${attr}]`, drawer);
  // The control can legitimately vanish (last one removed, or now disabled) —
  // fall back to something adjacent inside the dialog rather than <body>.
  if (!el || el.disabled) {
    el = $(`[data-line-remove="${fallbackSize ?? val}"]`, drawer)
      || $('[data-cart-close]', drawer)
      || $('#cart-title', drawer);
  }
  el?.focus();
}

function renderCart() {
  const hadFocus = drawer.contains(document.activeElement) ? focusKey(document.activeElement) : null;
  const snap = cart.snapshot();
  const count = snap.count;

  $('[data-cart-count]').textContent = String(count);
  $('[data-cart-open]').setAttribute(
    'aria-label', count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart, empty'
  );

  const body = $('[data-cart-body]');
  const foot = $('[data-cart-foot]');

  // Any mutation other than the removal itself retires the undo offer, so it
  // can never re-insert a line the shopper has since moved on from.
  clearUndo();

  if (!count) {
    body.innerHTML = `<div class="empty">${MARK}<p>Nothing in here.</p></div>`;
    // Emptied, not just hidden: a hidden-but-present mailto link stays in the
    // tab order's reckoning and can become the trap's "last" stop.
    $('[data-checkout-slot]').innerHTML = '';
    foot.hidden = true;
    if (hadFocus) $('[data-cart-close]', drawer)?.focus();
    return;
  }

  foot.hidden = false;
  // No thumbnail: at 56px the porpoise's eyes and smile turn to noise, and in a
  // shop with one product a picture of that product tells you nothing you did
  // not already know from the words next to it.
  body.innerHTML = snap.lines.map((l) => `
    <div class="line">
      <div>
        <p class="line__name">${PRODUCT.name}</p>
        <p class="line__size">Size ${l.size}</p>
        <div class="line__row">
          <div class="stepper">
            <button type="button" class="stepper__btn stepper__btn--minus"
              data-line-dec="${l.size}" aria-label="One fewer, size ${l.size}"></button>
            <span class="stepper__n">${l.qty}</span>
            <button type="button" class="stepper__btn stepper__btn--plus"
              data-line-inc="${l.size}" aria-label="One more, size ${l.size}"
              ${l.qty >= 10 ? 'disabled' : ''}></button>
          </div>
          <span class="line__total">${money(l.lineTotal)}</span>
        </div>
        <button type="button" class="txtbtn" data-line-remove="${l.size}">Remove</button>
      </div>
    </div>`).join('');

  $('[data-subtotal]').textContent = money(snap.subtotal);

  // Honest hand-off: when no store is wired up the button is replaced by an
  // explanation, not disabled. A disabled button explains nothing.
  $('[data-checkout-slot]').innerHTML = isConfigured()
    ? '<a class="cta press" data-checkout-go>Checkout</a>'
    : '<p class="notwired">Checkout is not wired up yet. Email ' +
      '<a href="mailto:hello@youhavenoporpoise.com">hello@youhavenoporpoise.com</a>' +
      ' and we will sort it out.</p>';

  const go = $('[data-checkout-go]');
  if (go) go.href = checkoutUrl(snap.lines) || '#';

  restoreFocus(hadFocus);
}

function clearUndo() {
  lastRemoved = null;
  const el = $('[data-undo]');
  el.hidden = true;
  el.innerHTML = '';
}

// Offered after a removal and never on a timer — an undo that expires while
// you are reading it is not an undo.
function showUndo(size, qty) {
  lastRemoved = { size, qty };
  const el = $('[data-undo]');
  el.hidden = false;
  el.innerHTML = `<button type="button" class="txtbtn" data-undo-go>Undo removing size ${size}</button>`;
}

/* ── drawer ──────────────────────────────────────────────────────────── */

const drawer = $('[data-drawer]');
const scrim = $('[data-scrim]');

// Everything behind the dialog goes inert. Discovered rather than named, so a
// future body-level sibling (the skip link was one) cannot be forgotten. The
// live region is exempt: it still has to announce while the cart is open.
let inerted = [];
function setBackdropInert(on) {
  if (on) {
    inerted = [...document.body.children].filter(
      (el) => el !== drawer && el !== scrim && !el.hasAttribute('data-status')
    );
    for (const el of inerted) el.inert = true;
  } else {
    for (const el of inerted) el.inert = false;
    inerted = [];
  }
}

// `hidden` is not the source of truth for openness: it stays false for the
// 200ms of the close transition, and during that window an Add to cart would
// return early here and add the item to an invisible drawer.
let cartOpen = false;
let closeTimer = null;

function openCart() {
  if (cartOpen) return;
  cartOpen = true;
  clearTimeout(closeTimer);             // cancel a close still in flight
  closeTimer = null;
  opener = document.activeElement;
  drawer.hidden = false;
  scrim.hidden = false;
  drawer.classList.add('is-closed');
  void drawer.offsetWidth;              // commit the closed position first
  drawer.classList.remove('is-closed');
  setBackdropInert(true);
  document.body.style.overflow = 'hidden';
  $('#cart-title').focus();
}

function closeCart() {
  if (!cartOpen) return;
  cartOpen = false;
  drawer.classList.add('is-closed');
  setBackdropInert(false);
  document.body.style.overflow = '';
  const done = () => { drawer.hidden = true; scrim.hidden = true; closeTimer = null; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) done();
  else closeTimer = setTimeout(done, 200);
  // Focus has to move out before the dialog is hidden, or it is stranded in a
  // hidden subtree. <body> counts as no opener — focusing it is a no-op that
  // would leave focus inside the drawer.
  const usable = opener && opener.isConnected && opener !== document.body;
  (usable ? opener : $('[data-cart-open]')).focus();
  opener = null;
}

function trapFocus(e) {
  if (e.key !== 'Tab' || !cartOpen) return;
  // offsetParent filters out anything inside the hidden footer — otherwise the
  // "last" item can be a display:none control and Tab walks straight out.
  const items = $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', drawer)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === $('#cart-title', drawer))) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault(); first.focus();
  }
}

/* ── sticky bar ──────────────────────────────────────────────────────── */

function initStickyBar() {
  const inBlockCta = $('.block--buy .cta');
  const bar = $('[data-stickybar]');
  new IntersectionObserver(
    ([entry]) => { bar.hidden = entry.isIntersecting; },
    { rootMargin: '0px 0px -80px 0px' }
  ).observe(inBlockCta);
}

/* ── wiring ──────────────────────────────────────────────────────────── */

function initEvents() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-add]')) return addToCart();
    if (t.closest('[data-cart-open]')) return openCart();
    if (t.closest('[data-cart-close]')) return closeCart();
    if (t === scrim) return closeCart();
    if (t.closest('[data-qty-dec]')) return setQty(qty - 1);
    if (t.closest('[data-qty-inc]')) return setQty(qty + 1);

    const dec = t.closest('[data-line-dec]');
    if (dec) {
      const size = dec.dataset.lineDec;
      const line = cart.lines.find((l) => l.size === size);
      if (line && line.qty === 1) {
        cart.remove(size);
        showUndo(size, 1);
        announce(`Removed. ${PRODUCT.name}, size ${size}.`);
      } else if (line) {
        cart.setQty(size, line.qty - 1);
        announce(`Size ${size}, quantity ${line.qty}.`);
      }
      return;
    }
    const inc = t.closest('[data-line-inc]');
    if (inc) {
      const size = inc.dataset.lineInc;
      const line = cart.lines.find((l) => l.size === size);
      if (line) {
        cart.setQty(size, line.qty + 1);
        announce(`Size ${size}, quantity ${line.qty}.`);
      }
      return;
    }
    const rm = t.closest('[data-line-remove]');
    if (rm) {
      const size = rm.dataset.lineRemove;
      const line = cart.lines.find((l) => l.size === size);
      const had = line ? line.qty : 1;
      cart.remove(size);
      showUndo(size, had);
      announce(`Removed. ${PRODUCT.name}, size ${size}.`);
      return;
    }
    if (t.closest('[data-undo-go]') && lastRemoved) {
      cart.add(lastRemoved.size, lastRemoved.qty);
      lastRemoved = null;
      $('[data-undo]').hidden = true;
      return;
    }
    // The size guide is an in-page anchor, never a dialog — which keeps it
    // crawlable, no-JS, and out of the radiogroup entirely.
    if (t.closest('[data-sizeguide-link]')) {
      setTimeout(() => $('#size-guide .h2').focus({ preventScroll: true }), 400);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) return closeCart();
    trapFocus(e);
  });

  cart.addEventListener('change', renderCart);

  let t;
  const relayout = () => { clearTimeout(t); t = setTimeout(layoutField, 150); };
  addEventListener('resize', relayout);

  // Blocks change height in normal use — the size error appears, the cart
  // re-renders. Watch the content column so the deleted band stays on each
  // block's centre. Safe from feedback: neither pass alters the column's height.
  new ResizeObserver(relayout).observe($('.column'));
}

/* ── boot ────────────────────────────────────────────────────────────── */

pressParity();
initSizes();
initEvents();
initStickyBar();
setQty(1, { silent: true });
renderCart();

// The field can only be fitted and cut once the real face has loaded, since
// both passes are measurements of rendered text.
layoutField();
document.fonts?.ready.then(layoutField);
addEventListener('load', layoutField);
