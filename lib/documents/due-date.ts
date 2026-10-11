import { addDays, format, parseISO } from "date-fns";

/** Returns YYYY-MM-DD due date, or null when the client has no payment terms. */
export function computeDueDate(
  issuedAtIso: string,
  paymentTermsDays: number | null | undefined,
): string | null {
  if (paymentTermsDays === null || paymentTermsDays === undefined) return null;
  return format(addDays(parseISO(issuedAtIso), paymentTermsDays), "yyyy-MM-dd");
}
