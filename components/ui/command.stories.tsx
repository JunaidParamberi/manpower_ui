import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calculator, Calendar, CreditCard, Settings, User } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

const meta: Meta<typeof Command> = {
  title: "Base/Command",
  component: Command,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-80">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>Payments</span>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <User />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Calculator />
            <span>Calculator</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Empty: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-80">
      <CommandInput placeholder="Search for something rare..." defaultValue="xyzzy" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </Command>
  ),
};
