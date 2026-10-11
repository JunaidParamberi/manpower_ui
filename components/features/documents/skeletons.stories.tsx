import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  DocumentsPageSkeleton,
  DocumentsTableSkeleton,
  DocumentEditorSkeleton,
  TemplatePickerSkeleton,
  DocumentDetailSkeleton,
  DocumentsListPaneSkeleton,
  DocumentsMasterDetailSkeleton,
} from "./skeletons";

const meta: Meta = {
  title: "Features/Documents/Skeletons",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

export const DocumentsPage: StoryObj = {
  render: () => <DocumentsPageSkeleton />,
};
export const DocumentsTable: StoryObj = {
  render: () => <DocumentsTableSkeleton rowCount={5} />,
};
export const Editor: StoryObj = {
  render: () => <DocumentEditorSkeleton />,
};
export const TemplatePicker: StoryObj = {
  render: () => <TemplatePickerSkeleton templateCount={4} />,
};
export const DocumentDetail: StoryObj = {
  render: () => <DocumentDetailSkeleton />,
};

export const DocumentsListPane: StoryObj = {
  name: "List Pane (6 rows)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="w-72 border-r border-border h-[600px]">
      <DocumentsListPaneSkeleton rowCount={6} />
    </div>
  ),
};

export const DocumentsListPaneFewRows: StoryObj = {
  name: "List Pane (2 rows)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="w-72 border-r border-border h-[600px]">
      <DocumentsListPaneSkeleton rowCount={2} />
    </div>
  ),
};

export const MasterDetailLoading: StoryObj = {
  name: "Master–Detail (loading state)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="h-[700px] flex overflow-hidden">
      <DocumentsMasterDetailSkeleton rowCount={6} />
    </div>
  ),
};
