/**
 * Page-title specs for the surfaces outside the app shell.
 *
 * The app shell's spec lives on `PageHeader` (`PAGE_TITLE_CLASS`) and should be
 * reached through that component. These three are deliberately different — they
 * are full-bleed pages with their own rhythm — but each was repeated verbatim
 * across four to six files, which is how a spec drifts. One string each.
 */

/** Auth and account pages: login, sign-up, password reset, account deleted. */
export const AUTH_TITLE_CLASS =
  "font-heading text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground";

/** Onboarding steps and the completion loader. */
export const ONBOARDING_TITLE_CLASS =
  "font-heading text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[2.125rem]";

/** Client-facing document pages: quote, proposal, pay, LPO. */
export const PUBLIC_DOC_TITLE_CLASS =
  "font-heading text-xl font-semibold text-foreground";
