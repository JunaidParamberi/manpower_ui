import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  DollarSign,
  Settings,
  ChevronDown,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
} from "./sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Base/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Clients", icon: Users },
  { label: "Projects", icon: FolderOpen },
  { label: "Documents", icon: FileText },
  { label: "Finance", icon: DollarSign },
];

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="size-6 rounded-md bg-primary" />
            <span className="font-semibold text-sm">Manpower</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Work</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-muted-foreground px-2">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <main className="p-4">
          <p className="text-sm text-muted-foreground">Main content area</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-center px-2 py-1">
            <div className="size-6 rounded-md bg-primary" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton tooltip={item.label}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <span className="text-sm font-medium">Toggle sidebar with button</span>
        </header>
      </SidebarInset>
    </SidebarProvider>
  ),
};
