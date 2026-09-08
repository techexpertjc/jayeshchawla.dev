/**
 * Travel postcards for Traveller's Rest.
 *
 * Photographs live in `public/postcards/`. Run them through
 * `scripts/optimize-photos.mjs` first — a phone photo is 3-8 MB and this world
 * has a budget measured in hundreds of kilobytes.
 *
 * Order here is the order they appear on the board and in the gallery.
 */

export interface Postcard {
  /** Path under /public. */
  src: string;
  /** Where it was taken. Shown large in the gallery. */
  place: string;
  /** One line. Optional, but the wall is more interesting with them. */
  note?: string;
}

export const postcards: Postcard[] = [
  {
    src: "/postcards/himalayan-valley.webp",
    place: "The Himalayas",
    note: "Deodars below, snow above, and a whole valley holding its breath.",
  },
  {
    src: "/postcards/chumphon-pier.webp",
    place: "Chumphon, Thailand",
    note: "A long pier out to the islands, and no particular hurry to be on it.",
  },
  {
    src: "/postcards/koh-kham.webp",
    place: "Koh Kham, Thailand",
    note: "A speck off the Trat coast — one hill, one beach, one jetty.",
  },
];
