/** Public site facts used by legal pages, SEO files and e-mails. Set them in the environment (see .env.example). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
export const OWNER_NAME = process.env.NEXT_PUBLIC_OWNER_NAME ?? "";
