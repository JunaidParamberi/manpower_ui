export const mockClient = {
  id: "c1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  name: "Acme Design Co.",
  email: "hello@acmedesign.co",
  phone: "+971 50 123 4567",
  company: "Acme Design Co.",
  address: "Dubai Marina, Dubai, UAE",
  currency: "AED",
  notes: "Preferred client. Net-30 terms.",
  health_score: 85,
  portal_token: "pt_abc123def456",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-05-20T14:30:00Z",
};

export const mockClient2 = {
  id: "c2a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  name: "Zenith Studio",
  email: "team@zenithstudio.io",
  phone: "+44 20 7946 0958",
  company: "Zenith Studio Ltd",
  address: "Shoreditch, London, UK",
  currency: "GBP",
  notes: null,
  health_score: 62,
  portal_token: "pt_xyz789ghi012",
  created_at: "2026-03-01T08:00:00Z",
  updated_at: "2026-05-18T11:00:00Z",
};

export const mockProject = {
  id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  client_id: "c1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Brand Refresh 2026",
  status: "active" as const,
  budget: 15000,
  spent: 4200,
  start_date: "2026-04-01",
  deadline: "2026-06-30",
  created_at: "2026-04-01T09:00:00Z",
  updated_at: "2026-05-20T16:00:00Z",
  clients: mockClient,
};

export const mockProject2 = {
  id: "p2a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  client_id: "c2a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "E-commerce Platform",
  status: "planning" as const,
  budget: 25000,
  spent: 0,
  start_date: "2026-06-01",
  deadline: "2026-09-30",
  created_at: "2026-05-10T12:00:00Z",
  updated_at: "2026-05-10T12:00:00Z",
  clients: mockClient2,
};

export const mockLineItem = {
  id: "li1a2b3c4-d5e6-7890-abcd-ef1234567890",
  document_id: "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
  description: "UI/UX Design — Homepage + 5 inner pages",
  quantity: 1,
  unit_price: 3500,
  tax_rate: 5,
  amount: 3675,
};

export const mockLineItem2 = {
  id: "li2a2b3c4-d5e6-7890-abcd-ef1234567890",
  document_id: "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
  description: "Frontend Development — React/Next.js",
  quantity: 40,
  unit_price: 150,
  tax_rate: 5,
  amount: 6300,
};

export const mockLineItems = [mockLineItem, mockLineItem2];

export const mockDocument = {
  id: "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  client_id: "c1a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  type: "invoice" as const,
  status: "sent" as const,
  title: "Invoice for Brand Refresh",
  content_json: null,
  pdf_url: null,
  sent_at: "2026-05-15T10:00:00Z",
  viewed_at: "2026-05-15T14:30:00Z",
  signed_at: null,
  invoice_number: "INV-0042",
  due_date: "2026-06-15",
  voucher_number: null,
  source_document_id: null,
  payment_id: null,
  created_at: "2026-05-14T09:00:00Z",
  updated_at: "2026-05-15T10:00:00Z",
  clients: mockClient,
  projects: mockProject,
  line_items: mockLineItems,
};

export const mockPayment = {
  id: "pay1a2b3c4-d5e6-7890-abcd-ef1234567890",
  document_id: "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
  amount: 9975,
  currency: "AED",
  method: "bank_transfer" as const,
  reference: "TXN-20260520-001",
  notes: "Paid in full",
  paid_at: "2026-05-20T09:00:00Z",
  created_at: "2026-05-20T09:00:00Z",
};

export const mockTask = {
  id: "t1a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Design homepage mockup",
  status: "in_progress" as const,
  due_date: "2026-05-28",
  priority: "high" as const,
  created_at: "2026-05-10T09:00:00Z",
  updated_at: "2026-05-22T16:00:00Z",
};

export const mockTask2 = {
  id: "t2a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Set up CI/CD pipeline",
  status: "todo" as const,
  due_date: "2026-06-05",
  priority: "med" as const,
  created_at: "2026-05-12T11:00:00Z",
  updated_at: "2026-05-12T11:00:00Z",
};

export const mockExpense = {
  id: "e1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  category: "Software",
  amount: 49.99,
  currency: "USD",
  vendor: "Figma",
  notes: "Monthly subscription",
  receipt_url: null,
  receipt_urls: [],
  date: "2026-05-01",
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
};

export const mockNotification = {
  id: "n1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  type: "invoice_paid" as const,
  payload: {
    document_id: "d1a2b3c4-d5e6-7890-abcd-ef1234567890",
    client_name: "Acme Design Co.",
    amount: 9975,
    currency: "AED",
  },
  read_at: null,
  action_taken_at: null,
  created_at: "2026-05-20T09:05:00Z",
};

export const mockBrandKit = {
  id: "bk1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  logo_url: null,
  primary_color: "#3550E0",
  secondary_color: "#1F8A52",
  font: "Inter",
  email_signature: "Best regards,\nJohn Doe\nManpower Studio",
};

export const mockProfile = {
  id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  email: "john@manpower.studio.com",
  full_name: "John Doe",
  plan_tier: "starter" as const,
  business_name: "Manpower Studio",
  country: "AE",
  currency: "AED",
};
