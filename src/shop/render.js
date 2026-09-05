// Every static region of the page, built from product.js and art.js.
//
// This runs at build time (and in dev, via the Vite plugin in vite.config.js),
// so the served HTML already contains the drawings, the size guide, the
// shipping table and the questions. The page is complete and readable with
// JavaScript switched off; JS only adds the field passes and the cart.
// One source of truth, no duplicated copy between HTML and data.

import { PRODUCT, SHIPPING, FAQ } from './product.js';
import { money } from './cart.js';
import { VIEWS, FRONT, STICKER, SILHOUETTE } from './art.js';

export const SITE = 'https://youhavenoporpoise.com';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

export const CONTENT = {
  // One source of truth for the price: product.js.
  price: money(PRODUCT.priceCents),

  sticker: STICKER,
  front: FRONT,
  coda: SILHOUETTE,

  views: VIEWS.map((v) => `
      <li>
        <div class="view__frame view">${v.svg}</div>
        <div class="view__cap">${esc(v.label)}</div>
      </li>`).join(''),

  specs: PRODUCT.specs
    .map(([k, v]) => `\n      <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join(''),

  sizetable: PRODUCT.measurements.rows.map(([size, c, l, s]) => `
      <tr>
        <th scope="row">${esc(size)}</th>
        <td class="num">${esc(c)}</td><td class="num">${esc(l)}</td><td class="num">${esc(s)}</td>
        <td class="stock">${PRODUCT.soldOut.includes(size) ? 'Sold out' : ''}</td>
      </tr>`).join(''),

  shiptable: SHIPPING.map(([where, when, cost]) => `
      <tr><th scope="row">${esc(where)}</th><td>${esc(when)}</td><td class="num">${esc(cost)}</td></tr>`).join(''),

  care: PRODUCT.care.map((l) => `\n        <li>${esc(l)}</li>`).join(''),

  faq: FAQ.map((f) => `
      <div class="faq__item">
        <p class="faq__q">${esc(f.q)}</p>
        <p class="faq__a">${esc(f.a)}</p>
      </div>`).join(''),

  // The sold-out size stays visible and focusable — hiding it just makes
  // people think they missed it.
  sizes: (() => {
    // The group's single tab stop starts on the first size you can actually
    // buy — landing a keyboard user on a sold-out chip wastes their first move.
    const firstSellable = PRODUCT.sizes.findIndex((s) => !PRODUCT.soldOut.includes(s));
    return PRODUCT.sizes.map((size, i) => {
      const out = PRODUCT.soldOut.includes(size);
      return `
        <button type="button" class="chip" role="radio" aria-checked="false"` +
        ` tabindex="${i === firstSellable ? 0 : -1}"${out ? ' aria-disabled="true"' : ''}` +
        ` aria-label="${esc(size)}${out ? ', sold out' : ''}" data-size="${esc(size)}">${esc(size)}</button>`;
    }).join('');
  })(),
};

// Product structured data, built from the same source as the page, so the
// price and availability a search engine shows can never drift from what the
// cart actually charges.
CONTENT.jsonld = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: PRODUCT.name,
  description:
    '425 gsm of organic cotton loopback, cut short, hood lined, printed on the chest. It is the only thing we make.',
  image: [`${SITE}/og.png`],
  brand: { '@type': 'Brand', name: 'PORP' },
  material: '100% organic cotton',
  offers: {
    '@type': 'Offer',
    url: `${SITE}/`,
    priceCurrency: 'USD',
    price: (PRODUCT.priceCents / 100).toFixed(2),
    availability: 'https://schema.org/InStock',
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'USD' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  },
}).replace(/</g, '\\u003c')}</` + `script>`;

// Replaces <!--@key--> placeholders in index.html.
export function injectContent(html) {
  return html.replace(/<!--@(\w+)-->/g, (match, key) =>
    key in CONTENT ? CONTENT[key] : match
  );
}
