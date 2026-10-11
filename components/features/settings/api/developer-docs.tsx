"use client";

import { useState } from "react";
import {
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Key,
  Database,
  Shield,
  Terminal,
  Globe,
  Cpu,
  FileJson,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Copy-to-clipboard code block                                       */
/* ------------------------------------------------------------------ */

function CodeBlock({ code, language = "bash", title }: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={cn("font-mono", language === "json" && "text-amber-600 dark:text-amber-400")}>
          {code}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

function Section({ id, icon: Icon, title, children }: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="pl-[42px] flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  MCP Tool card                                                      */
/* ------------------------------------------------------------------ */

function ToolCard({ name, description, mode, params }: {
  name: string;
  description: string;
  mode: "read" | "write" | "read/write";
  params?: { name: string; type: string; required?: boolean; description: string }[];
}) {
  const modeColor = mode === "read"
    ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
    : mode === "write"
      ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400";

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <code className="text-sm font-mono font-semibold text-foreground">{name}</code>
        <Badge variant="secondary" className={cn("text-[10px] font-medium", modeColor)}>
          {mode}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {params && params.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Parameters</p>
          <div className="flex flex-col gap-1.5">
            {params.map((p) => (
              <div key={p.name} className="flex items-start gap-2 text-xs">
                <code className="shrink-0 font-mono text-foreground">{p.name}</code>
                <span className="text-muted-foreground/60 shrink-0">{p.type}</span>
                {p.required && <Badge variant="outline" className="text-[9px] h-4 px-1">required</Badge>}
                <span className="text-muted-foreground">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main docs component                                                */
/* ------------------------------------------------------------------ */

export function DeveloperDocs() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started", icon: Key },
    { id: "mcp-tools", label: "MCP Tools", icon: Cpu },
    { id: "rest-api", label: "REST API", icon: Globe },
    { id: "connect", label: "Connect Your Tool", icon: Terminal },
    { id: "entities", label: "Entity Reference", icon: Database },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="size-4" />
          Developer Documentation
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Connect your Manpower workspace to Claude, Cursor, ChatGPT, Zapier,
          and any MCP-compatible tool. Read your business data, create records,
          and automate workflows — all authenticated with a single API key.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar nav */}
        <nav className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeSection === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-12">

          {/* ── Getting Started ── */}
          <Section id="getting-started" icon={Key} title="Getting Started">
            <div className="flex flex-col gap-3">
              <p>
                <strong className="text-foreground">1. Create an API key</strong> — Go to{" "}
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Settings → API & Integrations</span>{" "}
                and click <strong className="text-foreground">Create key</strong>. Give it a name (e.g. &quot;Claude Desktop&quot;),
                pick a type, and optionally set an expiry.
              </p>
              <p>
                <strong className="text-foreground">2. Copy the secret</strong> — The full key (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">ca_</code> + 40 hex characters) is shown <strong className="text-foreground">exactly once</strong>. Copy it now. It cannot be recovered later.
              </p>
              <p>
                <strong className="text-foreground">3. Paste it into your tool</strong> — Use the connection guides below for Claude Desktop, Cursor, Claude Code, ChatGPT, Zapier, or any HTTP client.
              </p>
            </div>

            <CodeBlock
              title="Your key format"
              code="ca_1a2b3c4d5e6f7890abcdef1234567890abcdef  ← 44 characters total"
            />

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-800 dark:text-amber-300 text-sm">
              <strong>⚠️ Treat your API key like a password.</strong> Anyone with it can read your Manpower data. If compromised, revoke it immediately in Settings → API & Integrations.
            </div>
          </Section>

          {/* ── MCP Tools ── */}
          <Section id="mcp-tools" icon={Cpu} title="MCP Tools Reference">
            <p>
              The MCP server exposes <strong className="text-foreground">4 tools</strong> that AI assistants call automatically. These are the same tools available through the REST API — the MCP protocol is just a different transport.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <ToolCard
                name="list_entities"
                description="Discovers all readable entities, their fields, and which ones support create/update. Call this first to learn what data is available."
                mode="read"
              />

              <ToolCard
                name="query_data"
                description="Read rows from any business table. Returns at most 20 rows — call again with tighter filters to paginate."
                mode="read"
                params={[
                  { name: "entity", type: "string", required: true, description: "Table name, e.g. clients, tasks, documents" },
                  { name: "filters", type: "object", description: "Column filters. Bare value = equality, object = operator (gte, lt, like, in, etc.)" },
                  { name: "columns", type: "string[]", description: "Columns to return. Omit for all readable columns." },
                  { name: "limit", type: "number", description: "Max rows (capped at 20)." },
                  { name: "orderBy", type: "string", description: "Column to sort by." },
                  { name: "ascending", type: "boolean", description: "Sort direction. Defaults to false." },
                ]}
              />

              <ToolCard
                name="create_record"
                description="Create a row in a safe, directly-owned table. Ownership is set automatically — never pass a user ID."
                mode="write"
                params={[
                  { name: "entity", type: "string", required: true, description: "clients, projects, tasks, time_entries, content_posts, content_campaigns, services, or expenses" },
                  { name: "fields", type: "object", required: true, description: "Field values to set. Only writable columns are accepted." },
                ]}
              />

              <ToolCard
                name="update_record"
                description="Update an existing row. Look up the ID with query_data first — never invent one."
                mode="write"
                params={[
                  { name: "entity", type: "string", required: true, description: "Table name" },
                  { name: "id", type: "uuid", required: true, description: "UUID of the row to update" },
                  { name: "fields", type: "object", required: true, description: "Fields to update" },
                ]}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
              <strong className="text-foreground">No delete tool.</strong> The API is read-mostly by design. Documents, invoices, payments, and profiles cannot be written through the API — use the Manpower app for those.
            </div>
          </Section>

          {/* ── REST API ── */}
          <Section id="rest-api" icon={Globe} title="REST API Reference">
            <p>
              All endpoints accept <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">Authorization: Bearer ca_...</code> or{" "}
              <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">X-Api-Key: ca_...</code>.
            </p>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">GET</Badge></TableCell>
                    <TableCell><code className="text-xs font-mono">/api/v1/entities</code></TableCell>
                    <TableCell>List all readable entities and their fields</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">GET</Badge></TableCell>
                    <TableCell><code className="text-xs font-mono">/api/v1/entities/:entity</code></TableCell>
                    <TableCell>Read rows from an entity (max 20)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">GET</Badge></TableCell>
                    <TableCell><code className="text-xs font-mono">/api/v1/entities/:entity/:id</code></TableCell>
                    <TableCell>Read a single row by UUID</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">POST</Badge></TableCell>
                    <TableCell><code className="text-xs font-mono">/api/v1/entities/:entity</code></TableCell>
                    <TableCell>Create a row (safe entities only)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">PATCH</Badge></TableCell>
                    <TableCell><code className="text-xs font-mono">/api/v1/entities/:entity/:id</code></TableCell>
                    <TableCell>Update a row (safe entities only)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">GET</Badge></TableCell>
                    <TableCell><code className="text-xs font-mono">/api/v1/openapi</code></TableCell>
                    <TableCell>OpenAPI 3.1 spec (paste into GPT Actions)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <CodeBlock
              title="Example — list all clients"
              code={`curl -H "Authorization: Bearer ca_YOUR_KEY" \\
  "https://app.manpower.app/api/v1/entities/clients"`}
            />

            <CodeBlock
              title="Example — filtered tasks"
              code={`curl -H "Authorization: Bearer ca_YOUR_KEY" \\
  "https://app.manpower.app/api/v1/entities/tasks?status=todo&limit=10&order_by=created_at"`}
            />

            <CodeBlock
              title="Example — create a client"
              language="json"
              code={`curl -X POST \\
  -H "Authorization: Bearer ca_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  "https://app.manpower.app/api/v1/entities/clients" \\
  -d '{"name": "Acme Corp", "email": "hello@acme.com", "company": "Acme"}'`}
            />
          </Section>

          {/* ── Connect your tool ── */}
          <Section id="connect" icon={Terminal} title="Connect Your Tool">
            <p>
              Pick your tool below and paste the config. All use the same API key.
            </p>

            <Tabs defaultValue="claude-desktop" className="w-full">
              <TabsList className="w-full justify-start gap-1 bg-muted/50 h-auto p-1 flex-wrap">
                <TabsTrigger value="claude-desktop" className="text-xs gap-1.5">
                  <Cpu className="size-3" />
                  Claude Desktop
                </TabsTrigger>
                <TabsTrigger value="cursor" className="text-xs gap-1.5">
                  <Terminal className="size-3" />
                  Cursor
                </TabsTrigger>
                <TabsTrigger value="claude-code" className="text-xs gap-1.5">
                  <Terminal className="size-3" />
                  Claude Code
                </TabsTrigger>
                <TabsTrigger value="chatgpt" className="text-xs gap-1.5">
                  <FileJson className="size-3" />
                  ChatGPT
                </TabsTrigger>
                <TabsTrigger value="zapier" className="text-xs gap-1.5">
                  <Zap className="size-3" />
                  Zapier
                </TabsTrigger>
              </TabsList>

              <TabsContent value="claude-desktop" className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-sm">
                  <p><strong className="text-foreground">1.</strong> Open Claude Desktop → ⚙️ Settings → Developer → <strong className="text-foreground">Edit Config</strong></p>
                  <p><strong className="text-foreground">2.</strong> Paste this into <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">claude_desktop_config.json</code>:</p>
                </div>
                <CodeBlock
                  title="claude_desktop_config.json"
                  language="json"
                  code={`{
  "mcpServers": {
    "manpower": {
      "type": "http",
      "url": "https://app.manpower.app/api/mcp",
      "headers": {
        "Authorization": "Bearer ca_YOUR_API_KEY_HERE"
      }
    }
  }
}`}
                />
                <p className="text-sm"><strong className="text-foreground">3.</strong> Restart Claude Desktop. Ask: &quot;Show me my clients&quot;</p>
              </TabsContent>

              <TabsContent value="cursor" className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-sm">
                  <p><strong className="text-foreground">1.</strong> Open Cursor → Settings (⌘+,) → Features → <strong className="text-foreground">MCP</strong></p>
                  <p><strong className="text-foreground">2.</strong> Click <strong className="text-foreground">+ Add new global MCP server</strong></p>
                  <p><strong className="text-foreground">3.</strong> Paste this JSON:</p>
                </div>
                <CodeBlock
                  title="cursor MCP config"
                  language="json"
                  code={`{
  "mcpServers": {
    "manpower": {
      "type": "http",
      "url": "https://app.manpower.app/api/mcp",
      "headers": {
        "Authorization": "Bearer ca_YOUR_API_KEY_HERE"
      }
    }
  }
}`}
                />
                <p className="text-sm"><strong className="text-foreground">4.</strong> Toggle the server to <strong className="text-foreground">on</strong> (green dot). Ask: &quot;List my projects&quot;</p>
              </TabsContent>

              <TabsContent value="claude-code" className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-sm">
                  <p><strong className="text-foreground">1.</strong> Run this one-time setup command:</p>
                </div>
                <CodeBlock
                  title="Terminal"
                  code={`claude mcp add manpower \\
  --transport http \\
  --url https://app.manpower.app/api/mcp \\
  --header "Authorization: Bearer ca_YOUR_API_KEY_HERE"`}
                />
                <p className="text-sm"><strong className="text-foreground">2.</strong> Verify: <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">claude mcp list</code></p>
                <p className="text-sm"><strong className="text-foreground">3.</strong> Start a session and ask: &quot;What clients do I have?&quot;</p>
              </TabsContent>

              <TabsContent value="chatgpt" className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-sm">
                  <p><strong className="text-foreground">Option A — Custom GPT:</strong></p>
                  <p><strong className="text-foreground">1.</strong> Go to <a href="https://chat.openai.com/gpts" target="_blank" rel="noopener" className="text-primary underline">chat.openai.com/gpts</a> → Create a GPT → Configure</p>
                  <p><strong className="text-foreground">2.</strong> Actions → Create new action</p>
                  <p><strong className="text-foreground">3.</strong> Schema URL: <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">https://app.manpower.app/api/v1/openapi</code></p>
                  <p><strong className="text-foreground">4.</strong> Authentication → API Key → Bearer → paste your <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">ca_</code> key</p>
                </div>
                <CodeBlock
                  title="OpenAPI spec URL"
                  code="https://app.manpower.app/api/v1/openapi"
                />
              </TabsContent>

              <TabsContent value="zapier" className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-sm">
                  <p><strong className="text-foreground">1.</strong> Create a new Zap → Action → <strong className="text-foreground">Webhooks by Zapier → Custom Request</strong></p>
                  <p><strong className="text-foreground">2.</strong> Configure:</p>
                </div>
                <CodeBlock
                  title="Zapier webhook config"
                  language="json"
                  code={`Method: GET (reads) or POST (creates)
URL:    https://app.manpower.app/api/v1/entities/clients
Header: Authorization → Bearer ca_YOUR_KEY`}
                />
                <p className="text-sm">Example: Sync new Gmail contacts to Manpower clients.</p>
              </TabsContent>
            </Tabs>
          </Section>

          {/* ── Entity Reference ── */}
          <Section id="entities" icon={Database} title="Entity Reference">
            <p>
              Every entity below is readable. <strong className="text-foreground">Writable</strong> means you can create and update through the API. <strong className="text-foreground">Blocked</strong> means the API refuses — use the Manpower app instead.
            </p>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Read</TableHead>
                    <TableHead className="text-center">Write</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { entity: "clients", desc: "Client CRM records", read: true, write: true },
                    { entity: "projects", desc: "Project tracker", read: true, write: true },
                    { entity: "tasks", desc: "Project tasks", read: true, write: true },
                    { entity: "time_entries", desc: "Time tracking", read: true, write: true },
                    { entity: "expenses", desc: "Business expenses", read: true, write: true },
                    { entity: "services", desc: "Service catalog", read: true, write: true },
                    { entity: "content_posts", desc: "Marketing content", read: true, write: true },
                    { entity: "content_campaigns", desc: "Marketing campaigns", read: true, write: true },
                    { entity: "documents", desc: "Invoices, quotes, proposals", read: true, write: false },
                    { entity: "line_items", desc: "Invoice/quote line items", read: true, write: false },
                    { entity: "payments", desc: "Payment records", read: true, write: false },
                    { entity: "profiles", desc: "User account", read: true, write: false },
                  ].map((row) => (
                    <TableRow key={row.entity}>
                      <TableCell><code className="text-xs font-mono font-semibold">{row.entity}</code></TableCell>
                      <TableCell className="text-muted-foreground">{row.desc}</TableCell>
                      <TableCell className="text-center">
                        <Check className="size-3.5 text-emerald-500 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        {row.write ? (
                          <Check className="size-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
              <strong className="text-foreground">Deletes are never exposed.</strong> No entity can be deleted through the API. Use the Manpower app for that.
            </div>
          </Section>

          {/* ── Security ── */}
          <Section id="security" icon={Shield} title="Security Model">
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Layer</TableHead>
                      <TableHead>What it does</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">Pro-plan gate</TableCell>
                      <TableCell>Key creation requires Pro ($49/mo) or Agency ($99/mo)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">SHA-256 hashing</TableCell>
                      <TableCell>Plaintext key is never stored — only the hash + 12-char prefix</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">User scoping</TableCell>
                      <TableCell>Every query is scoped to the authenticated user — you can only see your own data</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">Entity allowlist</TableCell>
                      <TableCell>Only safe, directly-owned entities are exposed — documents, payments, profiles, deletes are blocked</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">Field allowlist</TableCell>
                      <TableCell>user_id and internal fields can never be set through the API</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">Immediate revocation</TableCell>
                      <TableCell>Revoke a key → it&apos;s dead on the very next request</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
