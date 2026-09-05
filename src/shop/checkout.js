// Checkout hand-off.
//
// Stripe Checkout has to be created server-side with a secret key, which a
// static page cannot do — and must not, since the browser can't be trusted to
// say what a thing costs. So the cart is posted to the Worker in
// checkout-worker/, which owns the catalogue, prices it, and returns a Stripe
// URL to redirect to.
//
// Until WORKER_URL is set the drawer says so plainly rather than pretending.

export const CHECKOUT = {
  // Your deployed Worker, e.g. 'https://porp-checkout.<subdomain>.workers.dev'
  workerUrl: null,
};

export function isConfigured() {
  return typeof CHECKOUT.workerUrl === 'string' && CHECKOUT.workerUrl.length > 0;
}

/**
 * Exchanges the cart for a Stripe Checkout URL.
 * Sends sizes and quantities only — the Worker decides the price.
 * @returns {Promise<string>} the URL to send the shopper to
 */
export async function createCheckout(lines) {
  if (!isConfigured()) throw new Error('Checkout is not configured.');

  let res;
  try {
    res = await fetch(CHECKOUT.workerUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lines: lines.map((l) => ({ size: l.size, qty: l.qty })) }),
    });
  } catch {
    throw new Error('Could not reach checkout. Check your connection and try again.');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.url) {
    throw new Error(body.error || 'Checkout could not be started. Try again in a moment.');
  }
  return body.url;
}
