/** Static brand assets under `public/images/branding/`. */
const appIcon = "/images/branding/icon.png";

export const branding = {
  /** App icon — favicon, Apple touch, OG / Twitter card fallback. */
  appIcon,
  /** Sidebar / auth mark — same asset as favicon for one consistent icon. */
  mark: appIcon,
  /** Wordmark for light backgrounds (e.g. light theme). */
  wordmarkOnLightBg: "/images/branding/typeface-dark.svg",
  /** Wordmark for dark backgrounds (e.g. dark theme). */
  wordmarkOnDarkBg: "/images/branding/typeface-white.svg",
} as const;
