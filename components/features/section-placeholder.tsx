import { FormPageShell } from "@/components/shared/form-page-shell";
import { PageHeader } from "@/components/shared/page-header";

type SectionPlaceholderProps = {
  title: string;
  description?: string;
};

/** Full-width shell (left-aligned) to match list pages like Clients; description stays `max-w-md`. */
export function SectionPlaceholder({
  title,
  description = "This area will ship in the next milestone.",
}: SectionPlaceholderProps) {
  return (
    <FormPageShell maxWidth="full">
      <PageHeader title={title} description={description} />
    </FormPageShell>
  );
}
