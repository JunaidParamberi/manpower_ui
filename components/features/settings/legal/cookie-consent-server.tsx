import { CookieConsentRoot } from "@/components/features/settings/legal/cookie-consent-root";
import { createClient } from "@/lib/supabase/server";

export async function CookieConsentServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialHasProfileConsent = false;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("cookie_updated_at")
      .eq("id", user.id)
      .maybeSingle();

    initialHasProfileConsent = Boolean(data?.cookie_updated_at);
  }

  return (
    <CookieConsentRoot initialHasProfileConsent={initialHasProfileConsent} />
  );
}
