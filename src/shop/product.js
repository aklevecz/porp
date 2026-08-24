// The entire catalogue. One hoodie, forever.

export const PRODUCT = {
  name: 'The Porpoise Crop Hoodie',
  priceCents: 8800,
  sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
  // Sizes we can't currently ship. Rendered as disabled, never hidden —
  // hiding a size makes people think they missed it.
  soldOut: ['XS'],

  specs: [
    ['Fabric', '100% organic cotton, loopback fleece'],
    ['Weight', '425 gsm / 12.5 oz'],
    ['Fit', 'Boxy and cropped. Sits at the waist.'],
    ['Trim', 'Lined hood, flat drawstring, ribbed cuffs and hem'],
    ['Print', 'Water-based screen print, front chest'],
    ['Origin', 'Knit and sewn in Portugal'],
  ],

  // Garment measurements in inches, laid flat.
  // Chest is pit-to-pit; length is high point of shoulder to hem — short,
  // because it is cropped.
  measurements: {
    headers: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [
      ['XS', '19', '16½', '23'],
      ['S', '20½', '17', '23½'],
      ['M', '22', '17½', '24'],
      ['L', '24', '18', '24½'],
      ['XL', '26', '18½', '25'],
      ['2XL', '28', '19', '25½'],
    ],
  },

  care: [
    'Wash cold, inside out.',
    'Tumble dry low or hang it up.',
    'Do not iron the print.',
    'It will soften. That is the point.',
  ],
};

export const SHIPPING = [
  ['United States', '3–5 business days', 'Free'],
  ['Canada', '6–10 business days', '$12'],
  ['Everywhere else', '10–16 business days', '$22'],
];

export const FAQ = [
  {
    q: 'Is this the only thing you sell?',
    a: 'Yes. One hoodie, one print, six sizes. When we think of something else worth making, we will make that instead.',
  },
  {
    q: 'What size should I get?',
    a: 'It is boxy and it is short — the hem sits at the waist. Take your normal size for that. Go up one if you want more room through the body, knowing it will sit shorter still. Every flat measurement is in the size guide.',
  },
  {
    q: 'Will the print crack?',
    a: 'It is a water-based screen print, so it sits in the fabric rather than on top of it. Wash it cold and inside out and it will fade with the hoodie instead of peeling off it.',
  },
  {
    q: 'Does it shrink?',
    a: 'It is pre-shrunk. Expect under half an inch in length if you tumble dry it hot, which you should not do.',
  },
  {
    q: 'Can I return it?',
    a: 'Within 30 days, unworn and unwashed, for any reason or none. We pay return shipping inside the US.',
  },
  {
    q: 'Why is it called that?',
    a: 'You have no porpoise. Say it out loud.',
  },
];
