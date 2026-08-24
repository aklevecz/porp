// Checkout hand-off.
//
// There is no payment backend in this repo. Rather than fake a purchase, the
// button hands the cart to whatever real checkout gets wired up here — a
// Shopify permalink, a Stripe payment link, anything that takes a URL.
// Until one is set, the UI says so plainly instead of pretending.

export const CHECKOUT = {
  // e.g. 'https://shop.myshopify.com/cart/' (Shopify) or a Stripe payment link.
  // Leave null to keep the honest "not connected" state.
  baseUrl: null,

  // Map each size to the variant id your store uses. Only needed for Shopify.
  variantIds: {
    XS: null, S: null, M: null, L: null, XL: null, '2XL': null,
  },
};

export function isConfigured() {
  return typeof CHECKOUT.baseUrl === 'string' && CHECKOUT.baseUrl.length > 0;
}

// Shopify cart permalinks look like /cart/{variantId}:{qty},{variantId}:{qty}
export function checkoutUrl(lines) {
  if (!isConfigured()) return null;
  const parts = lines
    .map((l) => {
      const id = CHECKOUT.variantIds[l.size];
      return id ? `${id}:${l.qty}` : null;
    })
    .filter(Boolean);
  if (!parts.length) return CHECKOUT.baseUrl;
  return `${CHECKOUT.baseUrl.replace(/\/$/, '')}/${parts.join(',')}`;
}
