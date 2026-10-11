"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/monitoring/capture-error";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest });
  }, [error]);

  const router = useRouter();

  function handleReport() {
    captureError(error, { digest: error.digest, userTriggered: true });
    toast.success("Bug reported — thanks.");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="size-12 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          This page hit an unexpected error. Your data is safe.
        </p>
      </div>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Error digest: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
        <Button variant="ghost" onClick={handleReport}>
          Report this bug
        </Button>
      </div>
    </div>
  );
}
