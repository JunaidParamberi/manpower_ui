import { z } from "zod";

export const WORKER_LIMITS = {
  employee_id: 100,
  name: 300,
  nationality: 100,
  trade_category: 100,
  notes: 4000,
  doc_number: 100,
} as const;

export const WORKER_STATUSES = ["available", "deployed", "on_leave", "inactive"] as const;
export type WorkerStatusValue = (typeof WORKER_STATUSES)[number];

export const WORKER_STATUS_LABELS: Record<WorkerStatusValue, string> = {
  available: "Available",
  deployed: "Deployed",
  on_leave: "On leave",
  inactive: "Inactive",
};

export const workerStatusSchema = z.enum(WORKER_STATUSES);

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().default("");

const optionalDate = () =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().nullish(),
  );

const checkboxBoolean = () =>
  z.preprocess((v) => {
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "on") return true;
    if (v === "false" || v === undefined || v === null || v === "") return false;
    return v;
  }, z.boolean().default(false));

export const workerInputSchema = z.object({
  id: z.string().uuid().optional(),
  employee_id: z.string().trim().min(1, "Employee ID is required.").max(WORKER_LIMITS.employee_id),
  name: z.string().trim().min(1, "Name is required.").max(WORKER_LIMITS.name),
  nationality: optionalString(WORKER_LIMITS.nationality),
  trade_category: optionalString(WORKER_LIMITS.trade_category),
  status: workerStatusSchema.default("available"),
  supplier_id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().uuid().nullish(),
  ).optional(),
  client_ids: z.array(z.string().uuid()).optional().default([]),
  notes: optionalString(WORKER_LIMITS.notes),
  passport_number: optionalString(WORKER_LIMITS.doc_number),
  passport_expiry: optionalDate(),
  emirates_id: optionalString(WORKER_LIMITS.doc_number),
  emirates_id_expiry: optionalDate(),
  visa_number: optionalString(WORKER_LIMITS.doc_number),
  visa_expiry: optionalDate(),
  medical_fit: checkboxBoolean(),
  medical_expiry: optionalDate(),
  has_insurance: checkboxBoolean(),
  insurance_expiry: optionalDate(),
});

export type WorkerInput = z.infer<typeof workerInputSchema>;
