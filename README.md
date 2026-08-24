# porp

A shop that sells one crop hoodie.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

`index.html` is the shop. `porp.html` is the original WebGL piece, kept intact.

## The idea

The page is `images/porp_font.svg` at browser scale.

That file is a 782×782 sheet with **YOU HAVE NO PORPOISE** set once per line, fitted
to the square with equal 38px margins, eleven line-slots deep — and the seventh line
has been **deleted** so the porpoise can sit there. You can verify it: the row origins
run 68.21, 135.98 … 407.01, then jump straight to 542.52. That gap is 135.51, exactly
twice the 67.76 row pitch. One row is missing, on purpose.

So: the page ground is an Ink field of those rows. Every content block is an opaque
white hole knocked out of it, and **the field row that would pass through each block's
centre is deleted**, leaving a clear Ink band bisecting the block and running out into
the margins on both sides. Same move as the client's file, same reason.

The last thing on the page is that file reconstructed live — five uninterrupted rows
with the porpoise drawn over them and one row deleted behind it.

## Where every value comes from

| Thing | Source |
|---|---|
| `--ink: #231f20` | the `<rect fill>` and every stroke in `porp_font.svg` |
| `--paper: #ffffff` | the text fill in that file; the body fill in `isoporp.svg` |
| `--shadow: rgba(35,31,32,.30)` | the sticker's shadow opacity in `isoporp.svg` |
| letter-spacing `.08em` | measured off the wordmark's kern pairs |
| line-height `1.403` | 67.76 ÷ 48.3, the file's row pitch over its type size |
| phrase measure `14.64em` | x 38 → 745 at 48.3px; `word-spacing` is calibrated to hit it |
| the 3px pen | `isoporp.svg`'s 6-unit stroke at the 196px sticker's 0.5 scale |
| the CTA's `-1px 9px` shadow | that file's shadow offset (dx −2, dy +17.2) at the same 0.5 |

Two colours, two type families (Outfit 900 / Archivo), two line weights (3px and 1px),
`border-radius: 0` everywhere — the artwork supplies all the roundness. Only two things
on the page cast a shadow: the primary button and the hero sticker, because the source
file shadows only 2 of its 9 drawn elements.

## Layout

```
src/shop/
  render.js    every static region, built from product.js + art.js
  main.js      field fit, the deleted-row pass, sizes, cart, drawer
  shop.css     all styles
  art.js       the garment drawings, in the brand's own 6-unit pen
  product.js   the entire catalogue: one crop hoodie
  cart.js      localStorage-backed store, framework-free
  checkout.js  hand-off to a real store — see below
```

`render.js` is prerendered into `index.html` by a Vite plugin at **build and dev time**,
so the page is complete and readable with JavaScript switched off. JS only adds the
field passes and the cart.

## Wiring up checkout

There is no payment backend here, and the page says so plainly rather than faking a
purchase. Point `CHECKOUT.baseUrl` in `src/shop/checkout.js` at a Shopify cart permalink
or a Stripe payment link and fill in `variantIds`; the drawer swaps the explanation for
a real Checkout button on its own.

## Product drawings

There were no photographs, so the garment is drawn in the same vocabulary as the
sticker — 6-unit strokes, round caps, the porpoise paths lifted verbatim from
`assets/img/isoporp.svg`. Four views: front, the chest print, back, the hang tag.
Strokes use `vector-effect: non-scaling-stroke` so the line holds its weight at any
frame size.
