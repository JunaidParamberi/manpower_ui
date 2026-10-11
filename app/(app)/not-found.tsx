import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <SearchX className="size-12 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This URL doesn&apos;t exist or was moved.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>
    </div>
  );
}
