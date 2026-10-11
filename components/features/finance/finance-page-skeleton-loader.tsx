"use client";

import { FinancePageSkeleton } from "@/components/features/finance/skeletons";
import {
  FINANCE_INVOICE_LIMIT,
  useSkeletonCount,
} from "@/hooks/use-skeleton-count";

export function FinancePageSkeletonLoader() {
  const invoiceRowCount = useSkeletonCount("finance:invoices", {
    cap: FINANCE_INVOICE_LIMIT,
  });
  return <FinancePageSkeleton invoiceRowCount={invoiceRowCount} />;
}
