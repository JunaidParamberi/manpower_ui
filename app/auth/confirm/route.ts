import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { safeNextPath } from '@/lib/auth/safe-next-path'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = safeNextPath(_next, '/')
  const supabase = await createClient()

  // OAuth providers (Google, GitHub, etc.) return a code.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No code or token hash`)
}
