/**
 * Demo workspace seeded for every account the first time it is used.
 *
 * Everything here is plain data written through the same insert path the app
 * itself uses (`insertRow`), so column defaults, type coercion and unique
 * constraints behave identically to rows the user creates later.
 *
 * Dates are relative to "now" so the dashboard, overdue queues and calendars
 * always look current, no matter when the repo is cloned.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { POLICY_VERSION } from "@/config/legal";
import { insertRow, type MockDatabase } from "@/lib/mock/db";

export type SeedOptions = {
  db: MockDatabase;
  userId: string;
  email: string;
  fullName: string | null;
  onboardingComplete: boolean;
};

const DAY = 86_400_000;
const NOW = Date.now();

const isoAt = (daysAgo: number, hour = 10, minute = 0): string => {
  const d = new Date(NOW - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const dayOffset = (days: number): string =>
  new Date(NOW + days * DAY).toISOString().slice(0, 10);

const round2 = (n: number): number => Math.round(n * 100) / 100;

const doc = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    },
  ],
});

type Item = [description: string, quantity: number, unitPrice: number];

const lineTotal = (items: Item[], taxMode: string, taxRate: number): number => {
  const net = items.reduce((sum, [, qty, price]) => sum + qty * price, 0);
  const tax = taxMode === "none" ? 0 : (net * taxRate) / 100;
  return round2(net + tax);
};

export function seedWorkspace(options: SeedOptions): void {
  const { db, userId, email, fullName, onboardingComplete } = options;

  const push = (table: string, payload: Record<string, unknown>): Record<string, any> | null => {
    const result = insertRow(db, table, payload as any);
    if ("error" in result) {
      console.warn(`[mock-seed] ${table}: ${result.error.message}`);
      return null;
    }
    return result.row;
  };

  // ── Account ────────────────────────────────────────────────────────────
  const brandKitId = crypto.randomUUID();
  push("brand_kits", {
    id: brandKitId,
    user_id: userId,
    logo_url: null,
    primary_color: "#4f46e5",
    secondary_color: "#0ea5e9",
    font: "Inter",
    email_signature: `${fullName ?? "Demo User"}\nManpower — studio operations, sorted.`,
  });

  push("profiles", {
    id: userId,
    full_name: fullName,
    company_name: fullName ? `${fullName.split(" ")[0]} Studio` : null,
    vat_registered: false,
    vat_number: null,
    address_line1: "12 Harbour Street",
    address_line2: null,
    address_city: "Dubai",
    address_region: "Dubai",
    address_postal_code: "00000",
    address_country: "AE",
    brand_kit_id: brandKitId,
    onboarding_brand_skipped: false,
    onboarding_completed_at: onboardingComplete ? isoAt(48, 9) : null,
    plan_tier: "pro",
    default_tax_mode: "vat",
    default_tax_rate: 5,
    default_tds_rate: 0,
    terms_accepted_at: isoAt(48, 9),
    terms_version: POLICY_VERSION,
    privacy_accepted_at: isoAt(48, 9),
    privacy_version: POLICY_VERSION,
    cookie_analytics: true,
    cookie_marketing: false,
    cookie_updated_at: isoAt(47, 9),
    notification_email_prefs: {},
    active_thread_id: null,
  });

  push("subscriptions", {
    user_id: userId,
    lemon_squeezy_id: "mock-100481",
    plan: "pro",
    status: "active",
    current_period_end: dayOffset(21),
    ls_customer_id: "mock-cust-88213",
    ls_variant_id: "mock-var-pro",
    customer_portal_url: "/settings/billing",
  });

  push("consent_log", {
    user_id: userId,
    consent_type: "terms",
    action: "accepted",
    policy_version: POLICY_VERSION,
    metadata: { source: "onboarding" },
    created_at: isoAt(48, 9),
  });
  push("consent_log", {
    user_id: userId,
    consent_type: "privacy",
    action: "accepted",
    policy_version: POLICY_VERSION,
    metadata: { source: "onboarding" },
    created_at: isoAt(48, 9),
  });

  // ── Clients ────────────────────────────────────────────────────────────
  type ClientSeed = {
    name: string;
    contact: string;
    company: string;
    email: string;
    billing?: string;
    phone: string;
    address: string;
    currency: string;
    status: "lead" | "active" | "paused" | "past" | "archived";
    terms: number;
    health: number;
    tags: string[];
    website: string;
    notes: string;
  };

  const clientSeeds: ClientSeed[] = [
    {
      name: "Northwind Trading LLC",
      contact: "Sara Al Mansouri",
      company: "Northwind Trading LLC",
      email: "sara@northwindtrading.ae",
      billing: "ap@northwindtrading.ae",
      phone: "+971 4 555 0110",
      address: "Office 1204, Boulevard Plaza, Downtown Dubai",
      currency: "AED",
      status: "active",
      terms: 30,
      health: 82,
      tags: ["retail", "retainer"],
      website: "https://northwindtrading.ae",
      notes: "Prefers WhatsApp for approvals. VAT registered, needs TRN on invoices.",
    },
    {
      name: "Bluepeak Analytics Ltd",
      contact: "Tom Whitfield",
      company: "Bluepeak Analytics Ltd",
      email: "tom@bluepeak.io",
      billing: "finance@bluepeak.io",
      phone: "+44 20 7946 0102",
      address: "4 Shipping Lane, London E14",
      currency: "GBP",
      status: "active",
      terms: 14,
      health: 74,
      tags: ["saas", "uk"],
      website: "https://bluepeak.io",
      notes: "Pays on the 5th of each month. PO required above £5,000.",
    },
    {
      name: "Kestrel Studio",
      contact: "Maya Ortiz",
      company: "Kestrel Studio",
      email: "maya@kestrel.studio",
      phone: "+1 415 555 0143",
      address: "2100 Folsom Street, San Francisco",
      currency: "USD",
      status: "active",
      terms: 30,
      health: 91,
      tags: ["design", "referral"],
      website: "https://kestrel.studio",
      notes: "Referral from the Brand identity sprint. Always responds fast.",
    },
    {
      name: "Harbour & Vale Partners",
      contact: "Edmund Vale",
      company: "Harbour & Vale Partners",
      email: "edmund@harbourvale.co.uk",
      phone: "+44 161 555 0177",
      address: "Deansgate Square, Manchester M3",
      currency: "GBP",
      status: "paused",
      terms: 30,
      health: 48,
      tags: ["finance"],
      website: "",
      notes: "Engagement paused while they hire an in-house designer.",
    },
    {
      name: "Meridian Health Group",
      contact: "Dr. Layla Haddad",
      company: "Meridian Health Group",
      email: "layla@meridianhealth.ae",
      billing: "accounts@meridianhealth.ae",
      phone: "+971 2 555 0198",
      address: "Al Bateen, Abu Dhabi",
      currency: "AED",
      status: "active",
      terms: 45,
      health: 66,
      tags: ["healthcare", "uae"],
      website: "https://meridianhealth.ae",
      notes: "Procurement cycle runs monthly — send invoices before the 25th.",
    },
    {
      name: "Orbit Logistics FZE",
      contact: "Ravi Menon",
      company: "Orbit Logistics FZE",
      email: "ravi@orbitlogistics.ae",
      phone: "+971 4 555 0121",
      address: "JAFZA One, Jebel Ali",
      currency: "AED",
      status: "lead",
      terms: 30,
      health: 55,
      tags: ["lead", "logistics"],
      website: "",
      notes: "Met at the Gulf ops meetup. Wants an API integration quote.",
    },
    {
      name: "Tidewater Media",
      contact: "Jordan Blake",
      company: "Tidewater Media",
      email: "jordan@tidewater.tv",
      phone: "+1 305 555 0166",
      address: "801 Brickell Bay Drive, Miami",
      currency: "USD",
      status: "past",
      terms: 15,
      health: 39,
      tags: ["video"],
      website: "https://tidewater.tv",
      notes: "Project wrapped. Check in next quarter about a retainer.",
    },
    {
      name: "Cinder & Co Bakery",
      contact: "Priya Nair",
      company: "Cinder & Co Bakery",
      email: "priya@cinderco.com",
      billing: "hello@cinderco.com",
      phone: "+1 503 555 0139",
      address: "62 NW Everett, Portland",
      currency: "USD",
      status: "active",
      terms: 7,
      health: 78,
      tags: ["hospitality", "small-business"],
      website: "https://cinderco.com",
      notes: "Weekly ordering site updates. Prefers short email updates.",
    },
  ];

  const clients = clientSeeds.map(
    (seed) =>
      push("clients", {
        user_id: userId,
        name: seed.name,
        contact_name: seed.contact,
        company: seed.company,
        email: seed.email,
        billing_email: seed.billing ?? null,
        phone: seed.phone,
        address: seed.address,
        currency: seed.currency,
        relationship_status: seed.status,
        payment_terms_days: seed.terms,
        health_score: seed.health,
        tags: seed.tags,
        website: seed.website,
        notes: seed.notes,
        timezone: seed.currency === "AED" ? "Asia/Dubai" : seed.currency === "GBP" ? "Europe/London" : "America/Los_Angeles",
        preferred_contact_method: seed.currency === "AED" ? "whatsapp" : "email",
        lead_source: seed.status === "lead" ? "Event" : "Referral",
        tax_id: seed.currency === "AED" ? "TRN100392004700003" : null,
        portal_token: null,
      })!,
  );

  // ── Suppliers ────────────────────────────────────────────────────────
  type SupplierSeed = {
    name: string;
    code: string;
    license: string;
    vat: string | null;
    contact: string | null;
    email: string | null;
  };

  const supplierSeeds: SupplierSeed[] = [
    { name: "Jubily Power Technical Services L.L.C", code: "SUP/2026/001", license: "658443", vat: null, contact: "Ahmed Khalil", email: "ops@jubily.ae" },
    { name: "Al Maha Manpower Services", code: "SUP/2026/002", license: "214410", vat: "TRN100221000300003", contact: "Fatima Noor", email: "contact@almaha-ms.ae" },
    { name: "Gulf Trade Workforce Co", code: "SUP/2026/003", license: "778821", vat: null, contact: null, email: null },
  ];

  const suppliers = supplierSeeds.map(
    (s) =>
      push("suppliers", {
        user_id: userId,
        name: s.name,
        supplier_code: s.code,
        license_number: s.license,
        vat_number: s.vat,
        contact_name: s.contact,
        email: s.email,
        phone: null,
        website: null,
        notes: null,
        trade_license_document_url: null,
        vat_registration_document_url: null,
      })!,
  );

  // ── Project clients ──────────────────────────────────────────────────
  type ProjectClientSeed = { name: string; code: string; license: string };

  const projectClientSeeds: ProjectClientSeed[] = [
    { name: "G C S German Concrete Works and Building Contracting L.L.C", code: "PCL/2026/001", license: "812947" },
    { name: "Falcon Heights Construction L.L.C", code: "PCL/2026/002", license: "905512" },
  ];

  const projectClients = projectClientSeeds.map(
    (c) =>
      push("project_clients", {
        user_id: userId,
        name: c.name,
        client_code: c.code,
        license_number: c.license,
        vat_number: null,
        contact_name: null,
        email: null,
        phone: null,
        website: null,
        notes: null,
        trade_license_document_url: null,
        vat_registration_document_url: null,
      })!,
  );

  // ── Workers ───────────────────────────────────────────────────────────
  type WorkerSeed = {
    employeeId: string;
    name: string;
    nationality: string;
    trade: string;
    status: "available" | "deployed" | "on_leave" | "inactive";
    supplierIdx: number;
  };

  const workerSeeds: WorkerSeed[] = [
    { employeeId: "EMP/2026/0001", name: "Salifu Mumuni", nationality: "Ghana", trade: "Helper", status: "available", supplierIdx: 0 },
    { employeeId: "EMP/2026/0002", name: "Ibrahim Yusuf", nationality: "Ghana", trade: "Mason", status: "deployed", supplierIdx: 0 },
    { employeeId: "EMP/2026/0003", name: "Ramesh Kumar", nationality: "India", trade: "Electrician", status: "available", supplierIdx: 1 },
    { employeeId: "EMP/2026/0004", name: "Suresh Patel", nationality: "India", trade: "Plumber", status: "on_leave", supplierIdx: 1 },
    { employeeId: "EMP/2026/0005", name: "Juan Dela Cruz", nationality: "Philippines", trade: "Welder", status: "deployed", supplierIdx: 2 },
    { employeeId: "EMP/2026/0006", name: "Mark Santos", nationality: "Philippines", trade: "Carpenter", status: "inactive", supplierIdx: 2 },
  ];

  const workers = workerSeeds.map((w) =>
    push("workers", {
      user_id: userId,
      employee_id: w.employeeId,
      name: w.name,
      nationality: w.nationality,
      trade_category: w.trade,
      status: w.status,
      supplier_id: suppliers[w.supplierIdx].id,
      notes: null,
      passport_number: null,
      passport_expiry: null,
      passport_document_url: null,
      passport_document_optional_url: null,
      emirates_id: null,
      emirates_id_expiry: null,
      emirates_id_document_url: null,
      emirates_id_document_optional_url: null,
      visa_number: null,
      visa_expiry: null,
      visa_document_url: null,
      visa_document_optional_url: null,
      medical_fit: false,
      medical_expiry: null,
      has_insurance: false,
      insurance_expiry: null,
      photo_url: null,
      workmen_compensation_document_url: null,
      workmen_compensation_document_optional_url: null,
      medical_insurance_card_url: null,
      medical_insurance_card_optional_url: null,
      noc_current_sponsor_document_url: null,
      noc_client_document_url: null,
      trade_license_document_url: null,
    })!,
  );

  push("worker_clients", {
    user_id: userId,
    worker_id: workers[0].id,
    project_client_id: projectClients[0].id,
  });
  push("worker_clients", {
    user_id: userId,
    worker_id: workers[1].id,
    project_client_id: projectClients[0].id,
  });
  push("worker_clients", {
    user_id: userId,
    worker_id: workers[2].id,
    project_client_id: projectClients[1].id,
  });

  // ── Projects ───────────────────────────────────────────────────────────
  type ProjectSeed = {
    c: number;
    title: string;
    status: "planning" | "active" | "on_hold" | "completed" | "archived";
    budget: number;
    spent: number;
    rate: number;
    start: number;
    deadline: number;
  };

  const projectSeeds: ProjectSeed[] = [
    { c: 0, title: "Storefront replatform", status: "active", budget: 48000, spent: 21500, rate: 95, start: -35, deadline: 25 },
    { c: 0, title: "Loyalty app discovery", status: "planning", budget: 18000, spent: 0, rate: 95, start: 3, deadline: 45 },
    { c: 1, title: "Data dashboard build", status: "active", budget: 36000, spent: 14200, rate: 85, start: -21, deadline: 34 },
    { c: 1, title: "Quarterly retainer", status: "active", budget: 12000, spent: 3800, rate: 85, start: -50, deadline: 40 },
    { c: 2, title: "Brand identity refresh", status: "on_hold", budget: 15000, spent: 6400, rate: 110, start: -60, deadline: 10 },
    { c: 3, title: "Annual report microsite", status: "completed", budget: 22000, spent: 21750, rate: 90, start: -90, deadline: -7 },
    { c: 4, title: "Patient portal UX audit", status: "active", budget: 26000, spent: 9100, rate: 100, start: -14, deadline: 28 },
    { c: 5, title: "Logistics API integration", status: "planning", budget: 54000, spent: 0, rate: 120, start: 10, deadline: 70 },
    { c: 6, title: "Campaign video series", status: "completed", budget: 19000, spent: 19000, rate: 95, start: -120, deadline: -30 },
    { c: 7, title: "Menu & ordering site", status: "active", budget: 9500, spent: 4300, rate: 80, start: -9, deadline: 19 },
  ];

  const projects = projectSeeds.map((seed) => {
    const row = push("projects", {
      user_id: userId,
      client_id: clients[seed.c].id,
      title: seed.title,
      status: seed.status,
      budget: seed.budget,
      spent: seed.spent,
      hourly_rate: seed.rate,
      start_date: dayOffset(seed.start),
      deadline: dayOffset(seed.deadline),
    })!;
    return row;
  });

  // ── Milestones ─────────────────────────────────────────────────────────
  const milestoneSpecs: Array<[projectIndex: number, title: string, due: number, status: string]> = [
    [0, "Discovery & audit", -20, "completed"],
    [0, "Design system", -4, "in_progress"],
    [0, "Build & launch", 25, "upcoming"],
    [2, "Data model & wiring", -8, "completed"],
    [2, "Charts & drill-downs", 9, "in_progress"],
    [2, "Hardening & handover", 34, "upcoming"],
    [4, "Concepts", -45, "completed"],
    [4, "Refinement", -12, "in_progress"],
    [6, "Heuristic review", -6, "completed"],
    [6, "Stakeholder interviews", 12, "in_progress"],
    [9, "Menu content", -4, "completed"],
    [9, "Online ordering", 19, "in_progress"],
  ];

  const milestones = milestoneSpecs.map(([p, title, due, status]) =>
    push("project_milestones", {
      project_id: projects[p].id,
      title,
      description: null,
      status,
      due_date: dayOffset(due),
      sort_order: milestoneSpecs.filter(([mp]) => mp === p).findIndex(([, t]) => t === title),
      client_visible: true,
    })!,
  );

  const milestoneIdFor = (projectIndex: number, order: number): string | null => {
    const list = milestones.filter((_, i) => milestoneSpecs[i][0] === projectIndex);
    return list[order]?.id ?? null;
  };

  // ── Tasks ──────────────────────────────────────────────────────────────
  type TaskSeed = [
    projectIndex: number,
    title: string,
    status: "todo" | "in_progress" | "done" | "cancelled",
    priority: "low" | "medium" | "high",
    due: number | null,
    milestoneOrder: number | null,
    labels: string[],
    estimated: number,
  ];

  const taskSeeds: TaskSeed[] = [
    [0, "Audit current checkout flow", "done", "high", -24, 0, ["audit"], 240],
    [0, "Competitor teardown", "done", "medium", -18, 0, ["research"], 180],
    [0, "Migrate product catalogue", "in_progress", "high", -2, 1, ["migration", "backend"], 720],
    [0, "Design product card states", "done", "medium", -9, 1, ["design"], 300],
    [0, "Checkout QA pass", "todo", "high", 0, 2, ["qa"], 240],
    [0, "Set up analytics events", "todo", "medium", 6, 2, ["analytics"], 120],
    [0, "Write launch checklist", "todo", "low", 14, null, [], 90],
    [1, "Stakeholder interviews", "todo", "medium", 8, null, ["research"], 300],
    [1, "Loyalty mechanics workshop", "todo", "high", 12, null, ["workshop"], 180],
    [2, "Model revenue tables", "done", "high", -15, 0, ["backend"], 480],
    [2, "Wire warehouse connector", "in_progress", "high", 1, 0, ["backend", "api"], 600],
    [2, "Revenue chart: net vs gross", "in_progress", "medium", 3, 1, ["charts"], 240],
    [2, "Cohort breakdown panel", "todo", "medium", 11, 1, ["charts"], 300],
    [2, "Empty & error states", "todo", "low", 18, 2, ["design"], 120],
    [2, "Performance budget check", "todo", "medium", 26, 2, ["qa"], 90],
    [3, "October retainer: reporting", "in_progress", "medium", 4, null, ["reporting"], 360],
    [3, "October retainer: support inbox", "todo", "low", 7, null, ["support"], 180],
    [3, "Monthly metrics note", "done", "medium", -11, null, ["reporting"], 60],
    [4, "Logo grid & lockups", "done", "high", -50, 0, ["design"], 420],
    [4, "Type & colour exploration", "done", "high", -38, 0, ["design"], 480],
    [4, "Brand guidelines draft", "in_progress", "medium", 6, 1, ["design", "docs"], 540],
    [4, "Stationery mockups", "todo", "low", 22, null, ["design"], 240],
    [5, "Content freeze", "done", "high", -60, null, [], 60],
    [5, "Build report sections", "done", "high", -30, null, ["build"], 900],
    [5, "Deploy & handoff", "done", "medium", -8, null, ["deploy"], 120],
    [6, "Heuristic evaluation", "done", "high", -10, 0, ["audit"], 360],
    [6, "Interview 6 patients", "in_progress", "high", 2, 0, ["research"], 480],
    [6, "Journey map", "todo", "medium", 15, 1, ["research", "design"], 300],
    [6, "Prioritised findings", "todo", "medium", 27, 1, ["docs"], 240],
    [7, "Scope API integration", "todo", "high", 9, null, ["api"], 240],
    [7, "Sandbox credentials", "todo", "medium", 5, null, ["blocked"], 30],
    [8, "Storyboard sign-off", "done", "high", -110, null, ["video"], 240],
    [8, "Shoot days 1–2", "done", "high", -80, null, ["video"], 1920],
    [8, "Edit & grade", "done", "medium", -40, null, ["video"], 1200],
    [8, "Deliver cutdowns", "done", "medium", -31, null, ["video"], 300],
    [9, "Photograph menu items", "done", "medium", -7, 0, ["content"], 180],
    [9, "Menu content entry", "in_progress", "high", -1, 0, ["content"], 240],
    [9, "Integrate ordering widget", "todo", "high", 9, 1, ["build"], 360],
    [9, "Mobile QA", "todo", "medium", 17, 1, ["qa"], 120],
  ];

  const tasks = taskSeeds.map(([p, title, status, priority, due, milestoneOrder, labels, estimated]) => {
    const milestoneId = milestoneOrder === null ? null : milestoneIdFor(p, milestoneOrder);
    return push("tasks", {
      project_id: projects[p].id,
      title,
      status,
      priority,
      due_date: due === null ? null : dayOffset(due),
      start_date: due === null ? null : dayOffset(due - 7),
      completed_at: status === "done" && due !== null ? isoAt(Math.max(0, due - 1), 16) : null,
      labels,
      description: null,
      estimated_minutes: estimated,
      sort_order: taskSeeds.indexOf(taskSeeds.find((t) => t[1] === title)!),
      client_visible: priority !== "high" || status !== "todo",
      parent_task_id: null,
      milestone_id: milestoneId,
    })!;
  });

  push("task_comments", {
    task_id: tasks[2].id,
    user_id: userId,
    body: "Catalogue export is ready — 412 SKUs, 6 need images before launch.",
    client_visible: false,
  });
  push("task_comments", {
    task_id: tasks[20].id,
    user_id: userId,
    body: "Guidelines draft is at 80%; type scale still to finalise with Maya.",
    client_visible: true,
  });
  push("task_comments", {
    task_id: tasks[35].id,
    user_id: userId,
    body: "Ordering widget sandbox is waiting on the vendor's API key.",
    client_visible: false,
  });

  // ── Time entries ───────────────────────────────────────────────────────
  const timeDurations = [7200, 12600, 4500, 14400, 9900, 5400];
  for (let i = 0; i < 42; i++) {
    const projectIndex = [0, 2, 3, 6, 9, 4, 0, 2, 3, 6, 9, 4][i % 12];
    const startedDaysAgo = (i * 4) % 26;
    const duration = timeDurations[i % timeDurations.length];
    const startedAt = isoAt(startedDaysAgo, 9 + (i % 6), (i * 7) % 60);
    push("time_entries", {
      user_id: userId,
      project_id: projects[projectIndex].id,
      task_id: i % 3 === 0 ? tasks[i % tasks.length].id : null,
      description: ["Implementation", "Client calls", "Design work", "QA and fixes", "Planning"][i % 5],
      started_at: startedAt,
      ended_at: new Date(new Date(startedAt).getTime() + duration * 1000).toISOString(),
      paused_at: null,
      total_paused_seconds: i % 4 === 0 ? 600 : 0,
      duration_seconds: duration,
      billed: i % 3 !== 0,
      invoice_line_item_id: null,
    });
  }

  // ── Expenses ───────────────────────────────────────────────────────────
  const expenseSeeds: Array<[category: string, vendor: string, amount: number, daysAgo: number, projectIndex: number | null]> = [
    ["software", "Figma", 45, 2, null],
    ["software", "Linear", 32, 3, null],
    ["software", "AWS", 418.2, 6, 2],
    ["travel", "Emirates", 1840, 9, 0],
    ["meals", "Client lunch — Northwind", 265, 9, 0],
    ["housing", "WeWork desk", 1750, 12, null],
    ["marketing", "Meta Ads", 620, 14, 8],
    ["software", "Notion", 24, 15, null],
    ["travel", "Careem", 88.5, 16, 6],
    ["meals", "Team breakfast", 142, 18, null],
    ["other", "Stock photography", 199, 20, 4],
    ["software", "Adobe CC", 210, 22, null],
    ["marketing", "Google Ads", 940, 24, 9],
    ["travel", "Hotel — Abu Dhabi", 1260, 27, 6],
    ["housing", "Coworking day passes", 320, 29, null],
    ["meals", "Coffee run", 63, 31, null],
    ["other", "Legal review", 850, 33, null],
    ["software", "Loom", 30, 35, null],
  ];
  for (const [category, vendor, amount, daysAgo, projectIndex] of expenseSeeds) {
    push("expenses", {
      user_id: userId,
      project_id: projectIndex === null ? null : projects[projectIndex].id,
      category,
      amount,
      currency: "AED",
      date: dayOffset(-daysAgo),
      vendor,
      notes: null,
      receipt_url: null,
      receipt_urls: [],
    });
  }

  // ── Documents ──────────────────────────────────────────────────────────
  const sequences: Record<string, number> = {
    invoice: 0,
    quote: 0,
    proposal: 0,
    receipt: 0,
    local_purchase_order: 0,
  };

  const nextNumber = (type: string): string => {
    sequences[type] += 1;
    const prefixes: Record<string, string> = {
      invoice: "INV",
      quote: "QUO",
      proposal: "PRO",
      receipt: "RCT",
      local_purchase_order: "LPO",
    };
    return `${prefixes[type]}-${String(sequences[type]).padStart(4, "0")}`;
  };

  type DocSeed = {
    type: "invoice" | "quote" | "proposal" | "receipt" | "local_purchase_order";
    status: string;
    client: number;
    project?: number;
    title: string;
    issuedDaysAgo: number;
    dueInDays?: number;
    paidDaysAgo?: number;
    taxMode?: "none" | "vat";
    taxRate?: number;
    currency?: string;
    items: Item[];
    sentDaysAgo?: number;
    viewedDaysAgo?: number;
    approvedDaysAgo?: number;
    voidReason?: string;
  };

  const docSeeds: DocSeed[] = [
    { type: "invoice", status: "paid", client: 0, project: 0, title: "Storefront replatform — sprint 3", issuedDaysAgo: 46, dueInDays: -16, paidDaysAgo: 18, sentDaysAgo: 46, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Sprint 3 — cart & checkout", 1, 9500], ["Performance tuning", 6, 95]] },
    { type: "invoice", status: "paid", client: 1, project: 2, title: "Data dashboard — discovery", issuedDaysAgo: 39, dueInDays: -25, paidDaysAgo: 26, sentDaysAgo: 39, currency: "GBP", items: [["Discovery workshops", 3, 850], ["Data audit", 1, 1600]] },
    { type: "invoice", status: "paid", client: 2, project: 4, title: "Brand refresh — concepts", issuedDaysAgo: 33, dueInDays: -3, paidDaysAgo: 5, sentDaysAgo: 33, currency: "USD", items: [["Concept exploration", 1, 4200], ["Moodboards", 2, 450]] },
    { type: "invoice", status: "paid", client: 3, project: 5, title: "Annual report microsite — final", issuedDaysAgo: 28, dueInDays: -14, paidDaysAgo: 9, sentDaysAgo: 28, currency: "GBP", items: [["Microsite build", 1, 12800], ["Content migration", 14, 90]] },
    { type: "invoice", status: "paid", client: 7, project: 9, title: "Menu site — deposit", issuedDaysAgo: 8, dueInDays: -1, paidDaysAgo: 3, sentDaysAgo: 8, currency: "USD", items: [["Project deposit (50%)", 1, 4750]] },
    { type: "invoice", status: "sent", client: 0, project: 0, title: "Storefront replatform — sprint 4", issuedDaysAgo: 12, dueInDays: -6, sentDaysAgo: 12, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Sprint 4 — account area", 1, 9500], ["Bug fixes", 8, 95]] },
    { type: "invoice", status: "sent", client: 4, project: 6, title: "UX audit — phase 1", issuedDaysAgo: 9, dueInDays: 36, sentDaysAgo: 9, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Heuristic evaluation", 1, 6500], ["Interviews", 6, 550]] },
    { type: "invoice", status: "sent", client: 1, project: 3, title: "Quarterly retainer — October", issuedDaysAgo: 4, dueInDays: 10, sentDaysAgo: 4, currency: "GBP", items: [["Retainer — October", 1, 3000]] },
    { type: "invoice", status: "viewed", client: 7, project: 9, title: "Menu site — milestone 2", issuedDaysAgo: 6, dueInDays: 8, sentDaysAgo: 6, viewedDaysAgo: 2, currency: "USD", items: [["Online ordering integration", 1, 3600], ["Content entry", 6, 80]] },
    { type: "invoice", status: "partially_paid", client: 4, project: 6, title: "UX audit — phase 2", issuedDaysAgo: 16, dueInDays: 29, sentDaysAgo: 16, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Journey mapping", 1, 7200], ["Findings report", 1, 3600]] },
    { type: "invoice", status: "draft", client: 5, title: "API integration — estimate conversion", issuedDaysAgo: 2, currency: "AED", taxMode: "vat", taxRate: 5, items: [["Integration groundwork", 1, 12000]] },
    { type: "invoice", status: "voided", client: 6, title: "Video series — cancelled shoot day", issuedDaysAgo: 55, dueInDays: -41, sentDaysAgo: 55, currency: "USD", voidReason: "Shoot day rescheduled — reissued as a separate invoice.", items: [["Shoot day (cancelled)", 1, 4800]] },

    { type: "quote", status: "approved", client: 0, project: 0, title: "Storefront replatform", issuedDaysAgo: 70, sentDaysAgo: 70, approvedDaysAgo: 62, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Discovery & architecture", 1, 8500], ["Build sprints", 5, 9500], ["Launch support", 1, 3500]] },
    { type: "quote", status: "sent", client: 5, title: "Logistics API integration", issuedDaysAgo: 5, sentDaysAgo: 5, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Integration groundwork", 1, 12000], ["Connector development", 3, 9500]] },
    { type: "quote", status: "viewed", client: 4, project: 6, title: "Patient portal UX audit", issuedDaysAgo: 21, sentDaysAgo: 21, viewedDaysAgo: 4, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Audit", 1, 9800], ["Recommendations workshop", 2, 1400]] },
    { type: "quote", status: "draft", client: 7, title: "Menu site — phase 3", issuedDaysAgo: 1, currency: "USD", items: [["Loyalty integration", 1, 2400]] },
    { type: "quote", status: "declined", client: 3, title: "Retainer uplift proposal", issuedDaysAgo: 44, sentDaysAgo: 44, currency: "GBP", items: [["Retainer uplift", 1, 1200]] },
    { type: "quote", status: "sent", client: 2, title: "Design system audit", issuedDaysAgo: 3, sentDaysAgo: 3, currency: "USD", items: [["Audit", 1, 3200], ["Fix list", 1, 900]] },

    { type: "proposal", status: "approved", client: 0, project: 0, title: "Northwind — digital storefront proposal", issuedDaysAgo: 74, sentDaysAgo: 74, approvedDaysAgo: 63, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Strategy & design", 1, 14000], ["Engineering", 1, 26000]] },
    { type: "proposal", status: "sent", client: 5, title: "Orbit Logistics — integration proposal", issuedDaysAgo: 6, sentDaysAgo: 6, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Phase 1", 1, 21000], ["Phase 2", 1, 18000]] },
    { type: "proposal", status: "viewed", client: 4, title: "Meridian — patient experience programme", issuedDaysAgo: 15, sentDaysAgo: 15, viewedDaysAgo: 3, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Research", 1, 9000], ["Design", 1, 15000]] },
    { type: "proposal", status: "draft", client: 6, title: "Tidewater — 2027 retainer", issuedDaysAgo: 1, currency: "USD", items: [["Monthly retainer", 12, 1500]] },
    { type: "proposal", status: "declined", client: 3, title: "Harbour & Vale — brand system", issuedDaysAgo: 65, sentDaysAgo: 65, currency: "GBP", items: [["Brand system", 1, 9600]] },

    { type: "local_purchase_order", status: "approved", client: 4, title: "LPO — Meridian clinic signage", issuedDaysAgo: 26, sentDaysAgo: 26, approvedDaysAgo: 24, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Wayfinding design", 1, 8600]] },
    { type: "local_purchase_order", status: "sent", client: 0, title: "LPO — Northwind POS terminals", issuedDaysAgo: 7, sentDaysAgo: 7, taxMode: "vat", taxRate: 5, currency: "AED", items: [["Terminal setup", 4, 1250]] },
    { type: "local_purchase_order", status: "draft", client: 1, title: "LPO — Bluepeak kiosk", issuedDaysAgo: 1, currency: "GBP", items: [["Kiosk build", 1, 5400]] },
  ];

  const paidInvoices: Array<{ id: string; client: number; total: number; currency: string; paidAt: string }> = [];

  for (const seed of docSeeds) {
    const numberKey = seed.type === "local_purchase_order" ? "local_purchase_order" : seed.type;
    const number = nextNumber(numberKey);
    const taxMode = seed.taxMode ?? "none";
    const taxRate = seed.taxRate ?? 0;
    const total = lineTotal(seed.items, taxMode, taxRate);
    const issuedAt = isoAt(seed.issuedDaysAgo, 11);
    const numberField: Record<string, string> = {
      invoice: "invoice_number",
      quote: "quote_number",
      proposal: "proposal_number",
      receipt: "receipt_number",
      local_purchase_order: "lpo_number",
    };

    const documentId = crypto.randomUUID();
    const row = push("documents", {
      id: documentId,
      user_id: userId,
      client_id: clients[seed.client].id,
      project_id: seed.project === undefined ? null : projects[seed.project].id,
      type: seed.type,
      status: seed.status,
      title: seed.title,
      title_is_auto: false,
      content_json: doc(`${seed.title} — prepared for ${clientSeeds[seed.client].company}.`),
      [numberField[seed.type]]: number,
      issued_at: issuedAt,
      created_at: issuedAt,
      currency: seed.currency ?? "USD",
      tax_mode: taxMode,
      tax_rate: taxRate,
      sent_at: seed.sentDaysAgo === undefined ? null : isoAt(seed.sentDaysAgo, 11),
      viewed_at: seed.viewedDaysAgo === undefined ? null : isoAt(seed.viewedDaysAgo, 15),
      approved_at: seed.approvedDaysAgo === undefined ? null : isoAt(seed.approvedDaysAgo, 13),
      due_date: seed.dueInDays === undefined ? null : dayOffset(seed.dueInDays),
      paid_at: seed.paidDaysAgo === undefined ? null : isoAt(seed.paidDaysAgo, 14),
      valid_until: seed.type === "quote" ? dayOffset(seed.issuedDaysAgo + 30) : null,
      payment_terms: seed.type === "invoice" ? "Payment due on the terms agreed with your account manager." : null,
      notes_footer: "Thank you for your business.",
      void_reason: seed.voidReason ?? null,
      proposal_content:
        seed.type === "proposal"
          ? {
              headline: seed.title,
              headline_accent: clientSeeds[seed.client].company,
              subhead: "A focused engagement to ship the work, on time and on budget.",
              investment_range: `${seed.currency ?? "USD"} ${total.toLocaleString()}`,
              next_step_text: "Reply to this proposal to approve scope and kick off.",
            }
          : null,
      approval_otp: null,
      approval_otp_expires_at: null,
      approval_recipient_email: null,
      approval_token: null,
      deleted_at: null,
      pay_token: null,
    });

    if (!row) continue;

    seed.items.forEach(([description, quantity, unitPrice], index) => {
      push("line_items", {
        document_id: documentId,
        description,
        quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        sort_order: index,
        notes: null,
        hsn_sac_code: null,
      });
    });

    if (seed.type === "invoice" && seed.paidDaysAgo !== undefined) {
      const partial = seed.status === "partially_paid";
      const paidAmount = partial ? round2(total * 0.4) : total;
      push("payments", {
        document_id: documentId,
        user_id: userId,
        amount: paidAmount,
        currency: seed.currency ?? "USD",
        method: seed.client % 2 === 0 ? "bank_transfer" : "card",
        reference: partial ? "Part payment — balance next month" : `REF-${number.replace("-", "")}`,
        notes: null,
        paid_at: isoAt(seed.paidDaysAgo, 14),
        provider: "manual",
        external_id: null,
        fx_rate: null,
      });
      paidInvoices.push({
        id: documentId,
        client: seed.client,
        total,
        currency: seed.currency ?? "USD",
        paidAt: isoAt(seed.paidDaysAgo, 14),
      });
    }

    if (seed.type === "invoice" && seed.status === "partially_paid") {
      push("payments", {
        document_id: documentId,
        user_id: userId,
        amount: round2(total * 0.4),
        currency: seed.currency ?? "AED",
        method: "bank_transfer",
        reference: "Deposit",
        notes: null,
        paid_at: isoAt(12, 12),
        provider: "manual",
        external_id: null,
        fx_rate: null,
      });
    }
  }

  // Receipts point back at the invoices they settle.
  paidInvoices.slice(0, 7).forEach((invoice) => {
    const documentId = crypto.randomUUID();
    push("documents", {
      id: documentId,
      user_id: userId,
      client_id: clients[invoice.client].id,
      type: "receipt",
      status: "paid",
      title: `Receipt — ${clientSeeds[invoice.client].company}`,
      title_is_auto: true,
      content_json: doc("Payment received in full. Thank you."),
      receipt_number: nextNumber("receipt"),
      source_document_id: invoice.id,
      payment_id: null,
      currency: invoice.currency,
      paid_at: invoice.paidAt,
      issued_at: invoice.paidAt,
      created_at: invoice.paidAt,
      sent_at: invoice.paidAt,
      tax_mode: "none",
      tax_rate: 0,
    });
    push("line_items", {
      document_id: documentId,
      description: "Payment received",
      quantity: 1,
      unit_price: invoice.total,
      tax_rate: 0,
      sort_order: 0,
      notes: null,
      hsn_sac_code: null,
    });
  });

  // ── Document audit trail ───────────────────────────────────────────────
  const firstInvoice = paidInvoices[0];
  if (firstInvoice) {
    for (const [field, oldValue, newValue, daysAgo] of [
      ["status", "draft", "sent", 46],
      ["status", "sent", "viewed", 44],
      ["status", "viewed", "paid", 18],
    ] as Array<[string, string, string, number]>) {
      push("document_audit_log", {
        document_id: firstInvoice.id,
        user_id: userId,
        field,
        old_value: oldValue,
        new_value: newValue,
        changed_at: isoAt(daysAgo, 13),
      });
    }
  }

  // ── Recurring invoices ─────────────────────────────────────────────────
  const recurringSeeds: Array<[client: number, title: string, status: string, interval: string, nextInDays: number, occurrences: number]> = [
    [1, "Monthly analytics retainer", "active", "monthly", 9, 4],
    [0, "Monthly support hours", "active", "monthly", 16, 7],
    [7, "Weekly menu updates", "paused", "weekly", 5, 12],
  ];
  for (const [clientIndex, title, status, interval, nextInDays, occurrences] of recurringSeeds) {
    const recurringId = crypto.randomUUID();
    push("recurring_invoices", {
      id: recurringId,
      user_id: userId,
      client_id: clients[clientIndex].id,
      project_id: null,
      title,
      status,
      interval,
      interval_count: 1,
      start_date: dayOffset(-120),
      next_run_at: dayOffset(nextInDays),
      last_run_at: dayOffset(-nextInDays),
      end_date: null,
      occurrences_limit: null,
      auto_send: false,
      net_days: clientSeeds[clientIndex].terms,
      currency: clientSeeds[clientIndex].currency,
      tax_mode: "none",
      tax_rate: 0,
      discount_type: "percent",
      discount_value: 0,
      notes_footer: "Recurring invoice — thank you.",
      payment_terms: "Net terms as agreed.",
      line_items: [{ description: title, quantity: 1, unit_price: 3000, tax_rate: 0 }],
      occurrences_count: occurrences,
      source_document_id: null,
    });
    for (let run = 0; run < Math.min(occurrences, 4); run++) {
      push("recurring_invoice_runs", {
        recurring_invoice_id: recurringId,
        user_id: userId,
        document_id: null,
        period_start: dayOffset(-(run + 1) * 30),
        period_end: dayOffset(-run * 30),
        status: run === 0 ? "skipped" : "sent",
        error: run === 0 ? "Client had no billing contact on file." : null,
      });
    }
  }

  // ── Services catalogue ─────────────────────────────────────────────────
  const serviceSeeds: Array<[name: string, type: string, unit: string, rate: number, qty: number]> = [
    ["Product design", "service", "hr", 95, 10],
    ["Frontend engineering", "service", "hr", 110, 10],
    ["Backend engineering", "service", "hr", 120, 10],
    ["Brand workshop", "service", "day", 1800, 1],
    ["SEO audit", "service", "project", 2400, 1],
    ["Stock imagery pack", "product", "item", 180, 1],
    ["Monthly retainer", "service", "month", 3000, 1],
    ["Copywriting", "service", "word", 0.9, 2000],
    ["CMS licence", "product", "license", 420, 1],
  ];
  for (const [name, serviceType, unit, rate, qty] of serviceSeeds) {
    push("services", {
      user_id: userId,
      name,
      description: null,
      service_type: serviceType,
      unit,
      sku: null,
      default_qty: qty,
      cost_price: rate > 0 ? round2(rate * 0.55) : null,
      default_rate: rate,
      default_tax_mode: "vat",
      default_tax_rate: 5,
      hsn_sac_code: null,
      archived: false,
    });
  }

  // ── Templates ──────────────────────────────────────────────────────────
  const documentTemplates: Array<[type: string, name: string, description: string, text: string]> = [
    ["invoice", "Standard invoice", "Net-30 invoice with tax and notes footer.", "Invoice for {{client_name}} — payment due per agreed terms."],
    ["quote", "Fixed-price quote", "Scope, price and validity window.", "Quote for {{client_name}}, valid for 30 days from issue."],
    ["proposal", "Project proposal", "Cover, scope, timeline and investment.", "Proposal prepared for {{client_name}} by {{brand_business_name}}."],
    ["local_purchase_order", "Standard LPO", "Local purchase order acknowledgement.", "LPO acknowledgement for {{client_name}}."],
  ];
  for (const [type, name, description, text] of documentTemplates) {
    push("document_templates", {
      user_id: null,
      type,
      name,
      description,
      content_json: doc(text),
      is_system: true,
    });
  }

  const projectTemplates: Array<[name: string, description: string, milestones: string[], tasks: string[]]> = [
    ["Website redesign", "Discovery through launch for a client website project.", ["Discovery", "Design", "Build", "Launch"], ["Kickoff call", "Sitemap & wireframes", "Visual design", "CMS build", "QA", "Deploy"]],
    ["Brand identity sprint", "Research, concepts, refinement, and final brand delivery.", ["Research", "Concepts", "Refinement"], ["Audience research", "Moodboards", "Logo routes", "Guidelines"]],
    ["Monthly retainer", "Recurring monthly client work with setup, delivery, and review.", ["Setup", "Delivery", "Review"], ["Plan the month", "Ship deliverables", "Monthly report"]],
  ];
  for (const [name, description, templateMilestones, templateTasks] of projectTemplates) {
    const templateId = crypto.randomUUID();
    push("project_templates", {
      id: templateId,
      user_id: null,
      name,
      description,
      is_system: true,
    });
    const milestoneIds = templateMilestones.map((title, index) => {
      const row = push("project_template_milestones", {
        template_id: templateId,
        title,
        description: null,
        sort_order: index,
        client_visible: true,
      });
      return row?.id ?? null;
    });
    templateTasks.forEach((title, index) => {
      push("project_template_tasks", {
        template_id: templateId,
        milestone_template_id: milestoneIds[Math.min(Math.floor(index / 2), milestoneIds.length - 1)],
        title,
        description: null,
        estimated_minutes: 120 * (1 + (index % 3)),
        sort_order: index,
        client_visible: index % 2 === 0,
      });
    });
  }

  // ── Notifications ──────────────────────────────────────────────────────
  const invoiceDocs = docSeeds
    .map((seed, index) => ({ seed, index }))
    .filter(({ seed }) => seed.type === "invoice");
  const firstDocId = () => crypto.randomUUID();

  const notificationSeeds: Array<[type: string, payload: Record<string, unknown>, read: boolean, daysAgo: number]> = [
    ["invoice_paid", { href: "/documents", entity_id: firstDocId(), title: "Invoice INV-0001 paid", body: "AED 16,602.50 received from Northwind Trading LLC" }, true, 18],
    ["invoice_overdue", { href: "/documents", entity_id: firstDocId(), title: "Invoice INV-0006 is overdue", body: "Storefront replatform — sprint 4 · AED 10,280.00" }, false, 1],
    ["quote_approved", { href: "/documents", entity_id: firstDocId(), title: "Quote QUO-0001 approved", body: "Northwind Trading LLC approved the storefront quote" }, true, 62],
    ["task_due", { href: "/tasks", entity_id: tasks[4].id, title: "Checkout QA pass", body: "Due today · Storefront replatform" }, false, 0],
    ["task_overdue", { href: "/tasks", entity_id: tasks[2].id, title: "Migrate product catalogue", body: "Overdue · Storefront replatform" }, false, 2],
    ["daily_digest", { href: "/dashboard", entity_id: firstDocId(), title: "Today's digest", body: "2 invoices overdue, 3 tasks due, 1 follow-up pending" }, false, 0],
    ["doc_sent", { href: "/documents", entity_id: firstDocId(), title: "Quote QUO-0006 sent", body: "Design system audit → Kestrel Studio" }, true, 3],
    ["follow_up_pending", { href: "/documents", entity_id: firstDocId(), title: "Follow up on INV-0009", body: "Viewed 2 days ago, still unpaid" }, false, 2],
    ["client_health_drop", { href: "/clients", entity_id: clients[3].id, title: "Harbour & Vale Partners needs attention", body: "Health score dropped 12 points this month" }, false, 4],
    ["proposal_approved", { href: "/documents", entity_id: firstDocId(), title: "Proposal approved", body: "Northwind approved the digital storefront proposal" }, true, 63],
  ];
  void invoiceDocs;
  for (const [type, payload, read, daysAgo] of notificationSeeds) {
    push("notifications", {
      user_id: userId,
      type,
      payload,
      read_at: read ? isoAt(daysAgo, 18) : null,
      action_taken_at: null,
      created_at: isoAt(daysAgo, 8),
    });
  }

  // ── Follow-ups ─────────────────────────────────────────────────────────
  const followUpSeeds: Array<[trigger: string, subjectType: string, clientIndex: number, rung: number, status: string, daysAgo: number]> = [
    ["invoice_overdue", "document", 0, 1, "pending", 1],
    ["document_unanswered", "document", 4, 2, "pending", 3],
    ["project_stale", "project", 3, 1, "dismissed", 8],
  ];
  for (const [triggerType, subjectType, clientIndex, rung, status, daysAgo] of followUpSeeds) {
    push("follow_ups", {
      user_id: userId,
      trigger_type: triggerType,
      subject_type: subjectType,
      subject_id: firstDocId(),
      client_id: clients[clientIndex].id,
      rung,
      status,
      facts: {
        clientName: clientSeeds[clientIndex].company,
        documentTitle: subjectType === "document" ? "Invoice INV-0006" : "Quarterly retainer",
        daysSinceSent: daysAgo * 3,
        amount: "AED 10,280.00",
      },
      sent_at: status === "sent" ? isoAt(daysAgo, 9) : null,
      dismissed_at: status === "dismissed" ? isoAt(daysAgo, 10) : null,
    });
  }

  // ── Health snapshots & digests ─────────────────────────────────────────
  const healthSeeds: Array<[clientIndex: number, score: number, band: string, daysAgo: number]> = [
    [0, 82, "healthy", 1],
    [1, 74, "healthy", 1],
    [2, 91, "excellent", 1],
    [3, 48, "needs_attention", 1],
    [4, 66, "healthy", 1],
    [7, 78, "healthy", 1],
    [3, 60, "healthy", 8],
    [4, 71, "healthy", 8],
  ];
  for (const [clientIndex, score, band, daysAgo] of healthSeeds) {
    // Signals must be real HealthSignal rows (kind/severity/title/detail):
    // the client page maps each `kind` to a prompt and renders title/detail.
    const signals =
      band === "needs_attention"
        ? [
            { kind: "overdue_invoices", severity: "warning", title: "Overdue invoices", detail: "2 unpaid invoices, oldest 18 days overdue." },
            { kind: "gone_quiet", severity: "warning", title: "Gone quiet", detail: "No documents, project activity, or time entries in 56 days." },
          ]
        : score > 85
          ? []
          : [{ kind: "slow_payer", severity: "info", title: "Slow payer", detail: "Averaging 24 days to pay against 14-day terms." }];

    push("client_health_snapshots", {
      user_id: userId,
      client_id: clients[clientIndex].id,
      snapshot_date: dayOffset(-daysAgo),
      score,
      band,
      facts: { openInvoices: clientIndex % 3, lastActivityDays: daysAgo * 4 },
      signals,
    });
  }

  const digestSeeds: Array<[daysAgo: number, narrative: string]> = [
    [1, "Two invoices are overdue and one follow-up is waiting on a reply. Three tasks are due today across two active projects."],
    [2, "Cash collection improved this week — three invoices settled, one still open past terms."],
    [3, "One project slipped its milestone; the rest of the portfolio is on track."],
    [5, "Quiet week: two tasks closed, no new documents issued."],
  ];
  digestSeeds.forEach(([daysAgo, narrative], index) => {
    // `facts` must be a real DigestFacts: the dashboard brief reads
    // `facts.projects` (id/band per project) and `actions[].projectId`.
    const digestProjects = projects.slice(0, 4).map((project, pIndex) => {
      const score = 55 + ((index * 17 + pIndex * 23) % 80);
      return {
        id: project.id,
        title: String(project.title ?? `Project ${pIndex + 1}`),
        deadline: (project.deadline as string | null) ?? null,
        completionPct: 35 + ((pIndex * 13 + index * 7) % 50),
        score,
        band: score > 85 ? ("high" as const) : score > 55 ? ("medium" as const) : ("low" as const),
        signals: [],
      };
    });

    const digestActions = digestProjects.slice(0, 3).map((project) => ({
      projectId: project.id,
      title: `Review ${project.title}`,
      detail:
        project.band === "high"
          ? "This project needs attention this week."
          : "Keep this project moving — next step is already scoped.",
    }));

    push("project_digests", {
      user_id: userId,
      digest_date: dayOffset(-daysAgo),
      facts: {
        generatedFor: dayOffset(-daysAgo),
        currency: "USD",
        projects: digestProjects,
      },
      narrative,
      actions: digestActions,
    });
  });

  // ── Content calendar ───────────────────────────────────────────────────
  const campaigns: Array<{ id: string; name: string; goal: string; start: number; end: number }> = [];
  const campaignSeeds: Array<[name: string, goal: string, start: number, end: number, clientIndex: number | null]> = [
    ["Q4 product launch", "Drive sign-ups for the storefront launch", -18, 14, 0],
    ["Bakery autumn menu", "Showcase the new seasonal menu", -6, 22, 7],
    ["Thought leadership", "Publish two ops deep-dives per month", -30, 30, null],
  ];
  for (const [name, goal, start, end, clientIndex] of campaignSeeds) {
    const id = crypto.randomUUID();
    campaigns.push({ id, name, goal, start, end });
    push("content_campaigns", {
      id,
      user_id: userId,
      client_id: clientIndex === null ? null : clients[clientIndex].id,
      name,
      goal,
      start_date: dayOffset(start),
      end_date: dayOffset(end),
    });
  }

  const postSeeds: Array<[campaign: number, title: string, platform: string, status: string, daysFromNow: number]> = [
    [0, "Behind the replatform: why we rebuilt checkout", "linkedin", "posted", -12],
    [0, "Storefront launch countdown", "instagram", "posted", -7],
    [0, "5 signs your checkout is leaking revenue", "x", "scheduled", 2],
    [0, "Launch day thread", "linkedin", "scheduled", 12],
    [1, "Autumn menu is here", "instagram", "posted", -3],
    [1, "Meet the bakers: Priya's sourdough", "tiktok", "scheduled", 4],
    [1, "Weekend special announcement", "facebook", "drafted", 8],
    [2, "How we run a 4-day delivery week", "linkedin", "posted", -9],
    [2, "Ops metrics that actually matter", "x", "drafted", 6],
    [2, "Client onboarding checklist", "linkedin", "scheduled", 10],
    [2, "Studio tour reel", "instagram", "drafted", null as unknown as number],
    [2, "Newsletter: October notes", "email", "posted", -1],
  ] as Array<[number, string, string, string, number]>;

  for (const [campaignIndex, title, platform, status, daysFromNow] of postSeeds) {
    const campaign = campaigns[campaignIndex];
    const scheduled =
      status === "posted"
        ? isoAt(-daysFromNow, 9)
        : status === "scheduled"
          ? new Date(NOW + daysFromNow * DAY).toISOString()
          : null;
    push("content_posts", {
      user_id: userId,
      client_id: null,
      campaign_id: campaign.id,
      title,
      platform,
      caption: `${title} — ${campaign.name}.`,
      hashtags: ["#studio", "#ops", "#manpower"],
      media: [],
      status,
      scheduled_at: scheduled,
      created_at: isoAt(Math.abs(daysFromNow) + 3, 10),
    });
  }

  // ── Pinned items ───────────────────────────────────────────────────────
  const pinnedSeeds: Array<[type: string, id: string, label: string, href: string]> = [
    ["client", clients[0].id, clientSeeds[0].name, `/clients/${clients[0].id}`],
    ["project", projects[0].id, projects[0].title as string, `/projects/${projects[0].id}`],
    ["task", tasks[4].id, tasks[4].title as string, "/tasks"],
  ];
  pinnedSeeds.forEach(([type, id, label, href], index) => {
    push("pinned_items", {
      user_id: userId,
      item_type: type,
      item_id: id,
      item_label: label,
      item_href: href,
      position: index,
    });
  });

  // ── AI panel threads ───────────────────────────────────────────────────
  const threadId = crypto.randomUUID();
  push("ai_threads", {
    id: threadId,
    user_id: userId,
    messages: [],
    pending_tool: null,
    mode: "agent",
    status: "idle",
    title: "Overdue invoices this week",
    is_archived: false,
  });
  push("ai_threads", {
    user_id: userId,
    messages: [],
    pending_tool: null,
    mode: "ask",
    status: "idle",
    title: "Summarise the Northwind project",
    is_archived: false,
  });
  const messageSeeds: Array<[role: string, content: string, daysAgo: number]> = [
    ["user", "Which invoices are overdue right now?", 1],
    ["assistant", "Two invoices are past due: INV-0006 (AED 10,280, 6 days late) and INV-0009 is viewed but not yet overdue. INV-0006 belongs to Northwind Trading — want me to draft a follow-up?", 1],
    ["user", "Draft the follow-up email.", 1],
    ["assistant", "Draft ready — a short, friendly nudge referencing INV-0006 with the payment link. Confirm to send it.", 1],
    ["user", "How is the Storefront replatform tracking?", 0],
    ["assistant", "Sprint 4 is in flight: 4 of 7 tasks open, budget 45% spent with 52% of the timeline remaining. Checkout QA passes due today.", 0],
  ];
  let seq = 1;
  for (const [role, content, daysAgo] of messageSeeds) {
    push("ai_messages", {
      thread_id: threadId,
      user_id: userId,
      role,
      content,
      tool_calls: null,
      created_at: isoAt(daysAgo, 12, seq * 3),
      seq: seq++,
    });
  }
  // Point the profile at the seeded thread (update, not insert — the profile
  // row already exists and has a primary key constraint).
  const profileRow = db.tables.profiles?.find((row) => row.id === userId);
  if (profileRow) {
    profileRow.active_thread_id = threadId;
    profileRow.updated_at = new Date().toISOString();
  }

  // ── API keys & MCP connections (settings → API & integrations) ─────────
  push("api_keys", {
    user_id: userId,
    name: "Local development",
    key_prefix: "mk_live_7f3a",
    type: "secret",
    description: "Scratch key for the local integration tests.",
    key_hash: "mock-key-hash-1",
    scopes: ["read", "write"],
    tools: ["read_entity", "write_entity"],
    last_used_at: isoAt(2, 16),
    expires_at: null,
    revoked_at: null,
  });
  push("api_keys", {
    user_id: userId,
    name: "Zapier — invoice alerts",
    key_prefix: "mk_live_c19d",
    type: "restricted",
    description: "Read-only key used by the invoicing zap.",
    key_hash: "mock-key-hash-2",
    scopes: ["read"],
    tools: ["read_entity"],
    last_used_at: isoAt(9, 11),
    expires_at: dayOffset(60),
    revoked_at: null,
  });
  push("mcp_connections", {
    user_id: userId,
    client_id: "claude-desktop",
    client_name: "Claude Desktop",
    scopes: ["read_entity", "write_entity"],
    refresh_token_hash: "mock-refresh-hash",
    refresh_token_expires_at: dayOffset(30),
    last_used_at: isoAt(1, 17),
    revoked_at: null,
  });
  push("mcp_connections", {
    user_id: userId,
    client_id: "cursor",
    client_name: "Cursor",
    scopes: ["read_entity"],
    refresh_token_hash: null,
    refresh_token_expires_at: null,
    last_used_at: isoAt(5, 9),
    revoked_at: null,
  });

  // ── Sequences ──────────────────────────────────────────────────────────
  for (const [docType, lastValue] of Object.entries(sequences)) {
    push("document_sequences", { user_id: userId, doc_type: docType, last_value: lastValue });
  }
}
