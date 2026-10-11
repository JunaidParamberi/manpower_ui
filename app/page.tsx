import { redirect } from "next/navigation";

/**
 * App-only deploy: marketing lives elsewhere (e.g. Astro on www).
 * `/` is not a landing page — signed-out users are sent to login by middleware;
 * signed-in users land here briefly and are forwarded to the dashboard.
 */
export const dynamic = "force-dynamic";

export default function RootPage() {
  redirect("/dashboard");
}
