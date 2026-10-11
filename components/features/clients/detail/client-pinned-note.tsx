import Link from "next/link";

import { ClientSection, SECTION_LINK } from "@/components/features/clients/detail/client-section";

type ClientPinnedNoteProps = {
  notes: string;
  editHref: string;
  updatedAtLabel?: string;
};

/** The client's notes, pinned in the About tab. Edit goes to the client form. */
export function ClientPinnedNote({ notes, editHref, updatedAtLabel }: ClientPinnedNoteProps) {
  return (
    <ClientSection
      title="Pinned note"
      action={
        <Link href={editHref} className={SECTION_LINK}>
          Edit
        </Link>
      }
    >
      <div className="py-2.5">
        <p className="whitespace-pre-wrap rounded-md bg-[var(--warning-soft)] px-3 py-2.5 text-body text-[var(--fg-2)]">
          {notes.trim()}
        </p>
        {updatedAtLabel ? <p className="mt-2 text-meta text-[var(--fg-3)]">{updatedAtLabel}</p> : null}
      </div>
    </ClientSection>
  );
}
