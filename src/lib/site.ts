/**
 * Central LAAF.pk business configuration.
 *
 * The single source of truth for the LAAF store location used by the
 * Thank You / Order Confirmation page, Contact page, Footer, and any
 * other surface that needs to point customers to the physical store.
 *
 * Update the values here only — every consumer pulls from this file.
 */

/** Display name of the LAAF.pk store as it should appear to customers. */
export const STORE_NAME = "LAAF.pk";

/**
 * Public LAAF.pk business location.
 *
 * Currently the only address published on the public site (contact page
 * and footer) is "Rawalpindi, Pakistan". When a precise street address is
 * available, replace the `address` value below — the Google Maps link
 * will pick it up automatically.
 */
export const laafLocation = {
  name: STORE_NAME,
  city: "Rawalpindi",
  country: "Pakistan",
  address: "Shop No. 9, 1st Floor, Taj Mahal Plaza, Khurram Colony Sadiqabad, Rawalpindi, 46310, Pakistan",
  phone: "+92 314 530 2577",
  phoneRaw: "923145302577",
  mapsUrl:
    "https://maps.app.goo.gl/EuA8tbEvTagvTms9A",
  email: "laafpkk@gmail.com",
  socials: {
    facebook: "https://web.facebook.com/profile.php?id=61594125266799",
    instagram: "https://www.instagram.com/laaf.pk",
    tiktok: "https://www.tiktok.com/@laaf.pk",
  },
} as const;

export type LaafLocation = typeof laafLocation;
