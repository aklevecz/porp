# porp-checkout

A Cloudflare Worker that turns the shop's cart into a Stripe Checkout Session.

## Why a Worker at all

Creating a Checkout Session needs your Stripe **secret** key, and a static Pages
site cannot hold one. More importantly, the browser must never be the thing that
says what a hoodie costs — otherwise anyone can buy it for a penny with one
`fetch`. So the page posts sizes and quantities only, and this Worker prices the
order from its own copy of the catalogue.

There is nothing to set up inside Stripe. The Worker builds prices inline with
`price_data`, so you do **not** need to create products or copy variant IDs.

## Setup

```bash
cd checkout-worker
npm install

# 1. Your Stripe secret key. Start with the test key (sk_test_…).
#    Paste it at the prompt — it is never written to a file.
npx wrangler secret put STRIPE_SECRET_KEY

# 2. Deploy. This prints the Worker URL.
npx wrangler deploy
```

Then put that URL into `src/shop/checkout.js`:

```js
export const CHECKOUT = {
  workerUrl: 'https://porp-checkout.<your-subdomain>.workers.dev',
};
```

Commit and push — the site redeploys itself, and the drawer swaps the
"not wired up" note for a real Checkout button.

## Testing

Use Stripe test mode and card `4242 4242 4242 4242`, any future expiry, any CVC.
On success Stripe returns to `/?checkout=success`; the page clears the cart and
shows a confirmation. On cancel it returns to `/?checkout=cancelled` with the
cart still intact.

Going live is swapping the secret for your `sk_live_…` key and redeploying:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler deploy
```

## What it enforces

The Worker is the only authority on price and availability:

- prices come from `CATALOGUE`, never from the request
- unknown sizes, sold-out sizes and duplicate lines are rejected
- quantities are clamped to 1–10 per size
- only the origins in `ALLOWED_ORIGINS` may call it
- Stripe's own error text is logged, not returned to the shopper

`CATALOGUE.priceCents` must be kept in step with `src/shop/product.js`. That file
is what the page *displays*; this one is what the shopper is actually charged.

## Sharing a Stripe account with another site

Fine, and common — one Stripe account can sell more than one thing. Two things
worth knowing if you reuse an existing account:

- Charges land in the same dashboard and the same payouts as whatever else that
  account sells. Filter by the `sizes` metadata or the charge description to tell
  hoodie orders apart.
- The Worker sets `statement_descriptor_suffix: 'PORP'`, so the charge reads as
  your account's prefix plus PORP on the customer's card statement rather than
  as an unrelated business. That prefix is set once under
  **Stripe → Settings → Business → Public details**.

## Known limitation

Stripe Checkout shows every shipping option regardless of the address entered, so
a shopper could pick "United States — free" and then type a Canadian address.
For a shop this size that is caught at fulfilment. Conditional rates need either
Stripe Tax with a shipping profile, or creating the session after the country is
known.
