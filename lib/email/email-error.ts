export function formatEmailError(raw: string | undefined): string {
  if (!raw) return "Failed to send email. Please try again.";

  const msg = raw.toLowerCase();

  if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("403")) {
    return "Email service not configured. Contact support.";
  }
  if (msg.includes("domain") && (msg.includes("not verified") || msg.includes("invalid"))) {
    return "Sending domain not verified. Contact support.";
  }
  if (msg.includes("invalid email") || msg.includes("invalid_to") || msg.includes("to address")) {
    return "Invalid recipient email address.";
  }
  if (msg.includes("rate limit") || msg.includes("429") || msg.includes("too many")) {
    return "Too many emails sent. Please wait a minute and try again.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "Document not found.";
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout")
  ) {
    return "Network error — check your connection and try again.";
  }

  return "Failed to send email. Please try again.";
}
