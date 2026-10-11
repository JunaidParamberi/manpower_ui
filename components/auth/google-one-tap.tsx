"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

type CredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: unknown) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

async function generateNonce(): Promise<[string, string]> {
  const random = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...random));
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce),
  );
  const hashed = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [nonce, hashed];
}

/**
 * Google One Tap — personalized "Continue as <name>" prompt for returning users.
 * Renders nothing visible; Google injects its own iframe top-right.
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID + same client_id used in Supabase Google OAuth setup.
 */
export function GoogleOneTap({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const initialized = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const init = useCallback(async () => {
    if (initialized.current || !window.google?.accounts || !clientId) return;
    initialized.current = true;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return;

    const [nonce, hashedNonce] = await generateNonce();

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: CredentialResponse) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce,
        });
        if (!error) router.push(redirectTo);
      },
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      auto_select: true,
      itp_support: true,
    });

    window.google.accounts.id.prompt();
  }, [clientId, router, redirectTo]);

  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts) {
      void init();
      return;
    }
    const id = window.setInterval(() => {
      if (window.google?.accounts) {
        window.clearInterval(id);
        void init();
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [clientId, init]);

  if (!clientId) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => void init()}
    />
  );
}
