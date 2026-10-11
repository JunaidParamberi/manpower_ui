"use client";

import { createContext, useContext } from "react";
import type { PlanUsage } from "./helpers";

const defaultUsage: PlanUsage = {
  planTier: "free",
  clientCount: 0,
  docCountThisMonth: 0,
};

const PlanUsageContext = createContext<PlanUsage>(defaultUsage);

export function PlanUsageProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PlanUsage;
}) {
  return (
    <PlanUsageContext.Provider value={value}>
      {children}
    </PlanUsageContext.Provider>
  );
}

export function usePlanUsage(): PlanUsage {
  return useContext(PlanUsageContext);
}
