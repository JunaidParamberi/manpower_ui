/** The public page where a client approves or declines a quote or proposal. */
export function approvalLink(token: string, origin: string, kind: "quote" | "proposal" = "quote"): string {
  return `${origin.replace(/\/+$/, "")}/${kind}/${token}`;
}
