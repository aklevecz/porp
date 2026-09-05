/**
 * Creates a Stripe Checkout Session for the porp shop.
 *
 * The catalogue lives here rather than in the browser on purpose: the client
 * sends only sizes and quantities, never prices. If the page could name its own
 * price, anyone could buy the hoodie for a penny with one fetch call.
 *
 * Deploy:
 *   cd checkout-worker
 *   npx wrangler secret put STRIPE_SECRET_KEY     # paste your sk_live_… / sk_test_…
 *   npx wrangler deploy
 */

// Must stay in step with src/shop/product.js — that file is what the page
// *displays*; this is what the shopper is actually charged.
const CATALOGUE = {
  name: 'The Porpoise Crop Hoodie',
  description: '425 gsm organic cotton loopback, cropped, lined hood, chest print.',
  currency: 'usd',
  priceCents: 8800,
  sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
  soldOut: ['XS'],
  maxPerSize: 10,
};

// Mirrors the shipping table on the page.
const SHIPPING = [
  { label: 'United States', cents: 0, min: 3, max: 5 },
  { label: 'Canada', cents: 1200, min: 6, max: 10 },
  { label: 'Everywhere else', cents: 2200, min: 10, max: 16 },
];

const SHIP_TO = [
  'US', 'CA', 'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'DK', 'SE', 'NO',
  'FI', 'PT', 'AT', 'CH', 'PL', 'CZ', 'AU', 'NZ', 'JP', 'SG', 'KR', 'MX',
];

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors(origin) },
  });

function cors(origin) {
  if (!origin) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

/** Validate the cart the browser sent. Returns { lines } or { error }. */
function readCart(payload) {
  if (!payload || !Array.isArray(payload.lines)) return { error: 'Send { lines: [{ size, qty }] }.' };
  if (payload.lines.length === 0) return { error: 'The cart is empty.' };
  if (payload.lines.length > CATALOGUE.sizes.length) return { error: 'Too many lines.' };

  const seen = new Set();
  const lines = [];
  for (const raw of payload.lines) {
    if (!raw || typeof raw !== 'object') return { error: 'Malformed line.' };
    const size = String(raw.size);
    if (!CATALOGUE.sizes.includes(size)) return { error: `Unknown size: ${size}.` };
    if (CATALOGUE.soldOut.includes(size)) return { error: `${size} is sold out.` };
    if (seen.has(size)) return { error: `Size ${size} appears twice.` };
    const qty = Math.floor(Number(raw.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > CATALOGUE.maxPerSize) {
      return { error: `Quantity for ${size} must be between 1 and ${CATALOGUE.maxPerSize}.` };
    }
    seen.add(size);
    lines.push({ size, qty });
  }
  return { lines };
}

/** Stripe takes form-encoded bodies, including for nested params. */
function toForm(value, prefix = '', form = new URLSearchParams()) {
  if (value === null || value === undefined) return form;
  if (Array.isArray(value)) {
    value.forEach((v, i) => toForm(v, `${prefix}[${i}]`, form));
  } else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      toForm(v, prefix ? `${prefix}[${k}]` : k, form);
    }
  } else {
    form.append(prefix, String(value));
  }
  return form;
}

function sessionParams(lines, siteUrl) {
  return {
    mode: 'payment',
    // Prices are built here, from CATALOGUE — never from the request body.
    line_items: lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: CATALOGUE.currency,
        unit_amount: CATALOGUE.priceCents,
        product_data: {
          name: `${CATALOGUE.name} — ${l.size}`,
          description: CATALOGUE.description,
        },
      },
    })),
    success_url: `${siteUrl}/?checkout=success`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
    shipping_address_collection: { allowed_countries: SHIP_TO },
    shipping_options: SHIPPING.map((s) => ({
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: s.label,
        fixed_amount: { amount: s.cents, currency: CATALOGUE.currency },
        delivery_estimate: {
          minimum: { unit: 'business_day', value: s.min },
          maximum: { unit: 'business_day', value: s.max },
        },
      },
    })),
    // So the order is fulfillable without a second lookup.
    metadata: { sizes: lines.map((l) => `${l.size}x${l.qty}`).join(',') },
    payment_intent_data: {
      // This Stripe account may also be selling something else entirely. Without
      // this, a hoodie charge shows up on the customer's statement under
      // whatever the account's default descriptor is, which reads as a stranger
      // billing them and is a common cause of chargebacks.
      statement_descriptor_suffix: 'PORP',
      description: `${CATALOGUE.name} — ${lines.map((l) => `${l.size}x${l.qty}`).join(', ')}`,
    },
  };
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only.' }, 405, origin);
    }
    if (!origin) {
      return json({ error: 'Origin not allowed.' }, 403, null);
    }
    if (!env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set');
      return json({ error: 'Checkout is not configured.' }, 500, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Body must be JSON.' }, 400, origin);
    }

    const { lines, error } = readCart(payload);
    if (error) return json({ error }, 400, origin);

    const form = toForm(sessionParams(lines, env.SITE_URL));

    let res;
    try {
      res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          'content-type': 'application/x-www-form-urlencoded',
          // Guards against Stripe's own retries creating duplicate sessions.
          'idempotency-key': crypto.randomUUID(),
        },
        body: form,
      });
    } catch (e) {
      console.error('stripe request failed', { message: e.message });
      return json({ error: 'Could not reach the payment provider.' }, 502, origin);
    }

    const body = await res.json();
    if (!res.ok) {
      // Stripe's message can name a misconfiguration; log it, don't leak it.
      console.error('stripe rejected the session', { status: res.status, message: body?.error?.message });
      return json({ error: 'The payment provider refused the request.' }, 502, origin);
    }

    return json({ url: body.url }, 200, origin);
  },
};
