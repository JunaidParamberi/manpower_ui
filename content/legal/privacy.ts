import type { LegalDocumentSection } from "./types";

/** Placeholder copy — replace with counsel-approved Privacy Policy before launch. */
export const PRIVACY_SECTIONS: LegalDocumentSection[] = [
  {
    title: "Overview",
    paragraphs: [
      "This Privacy Policy explains how Manpower collects, uses, and protects personal data when you use our application.",
      "Manpower is the data controller for account and workspace data you store in the app.",
    ],
  },
  {
    title: "Data we collect",
    paragraphs: [
      "Account data: email address, name, company details, and authentication identifiers.",
      "Workspace data: clients, projects, documents, invoices, time entries, expenses, and files you upload.",
      "Technical data: cookies required for sign-in, optional analytics/marketing cookies if you opt in, and standard server logs.",
    ],
  },
  {
    title: "How we use data",
    paragraphs: [
      "We use your data to provide and improve the service, send transactional emails (invoices, auth, notifications), process subscriptions, and comply with legal obligations.",
      "We do not sell your personal data.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "Essential cookies are always active for authentication and core features.",
      "You can control optional analytics and marketing cookies via the cookie banner or Settings → Legal & privacy.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: [
      "You may export your workspace data or delete your account from Settings → Account.",
      "Depending on your location, you may have rights to access, correct, or erase personal data. Contact support@manpower.app to exercise these rights.",
    ],
  },
  {
    title: "Retention",
    paragraphs: [
      "We retain account data while your account is active. Deleting your account removes workspace data subject to our backup and legal retention policies.",
      "Consent log entries are kept as an audit trail of policy and cookie choices you make in the app.",
    ],
  },
  {
    title: "Contact",
    paragraphs: ["Questions about privacy: support@manpower.app"],
  },
];
