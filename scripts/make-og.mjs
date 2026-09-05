// Generates public/og.png — the social share card.
//
// Run manually after changing the product or the artwork:
//   node scripts/make-og.mjs
//
// It renders the page's own signature at 1200x630 (an Ink field of phrase rows
// with one row deleted behind a knocked-out block) in headless Chrome, which is
// how it gets the real Outfit face rather than a system substitute.

import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PRODUCT } from '../src/shop/product.js';
import { GARMENT_MARK } from '../src/shop/art.js';
import { money } from '../src/shop/cart.js';

const OUT = new URL('../public/og.png', import.meta.url).pathname;
const TMP = `${process.env.TMPDIR || '/tmp'}/porp-og.html`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PHRASE = 'YOU HAVE NO PORPOISE';
const ROWS = 7;
const CUT = 3; // the deleted row, behind the block

const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600&family=Outfit:wght@900&display=block">
<style>
  *{box-sizing:border-box;margin:0}
  :root{--ink:#231f20;--paper:#fff}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:var(--ink);position:relative;font-family:Archivo,sans-serif}
  .rows{position:absolute;inset:0;padding-inline:58px}
  .row{
    display:block;white-space:nowrap;color:var(--paper);
    font-family:Outfit,sans-serif;font-weight:900;
    font-size:75.8px;line-height:1.403;letter-spacing:.08em;word-spacing:.155em;
  }
  .row.cut{visibility:hidden}
  .block{
    position:absolute;left:96px;right:96px;top:150px;
    background:var(--paper);border:6px solid var(--ink);
    padding:44px 48px;display:flex;align-items:center;gap:48px;
  }
  .name{font-family:Outfit,sans-serif;font-weight:900;font-size:64px;line-height:.98;
    letter-spacing:.02em;text-transform:uppercase;color:var(--ink)}
  .price{font-family:Outfit,sans-serif;font-weight:900;font-size:44px;margin-top:18px;color:var(--ink)}
  .sub{font-weight:600;font-size:20px;letter-spacing:.14em;text-transform:uppercase;
    color:#656263;margin-top:20px}
  .mark{width:230px;flex:none;color:var(--ink)}
  .mark svg{width:100%;height:auto}
</style>
<div class="rows">${
  Array.from({ length: ROWS }, (_, i) =>
    `<span class="row${i === CUT ? ' cut' : ''}">${PHRASE}</span>`).join('')
}</div>
<div class="block">
  <div>
    <p class="name">${PRODUCT.name}</p>
    <p class="price">${money(PRODUCT.priceCents)}</p>
    <p class="sub">The only thing we make</p>
  </div>
  <div class="mark">${GARMENT_MARK}</div>
</div>`;

mkdirSync(new URL('../public', import.meta.url).pathname, { recursive: true });
writeFileSync(TMP, html);
execFileSync(CHROME, [
  '--headless', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--virtual-time-budget=8000',
  `--screenshot=${OUT}`,
  `file://${TMP}`,
], { stdio: 'inherit' });
console.log(`wrote ${OUT}`);
