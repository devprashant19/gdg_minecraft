import { createBrowserClient } from '@supabase/ssr';
import { clientEnv } from '@/lib/env';

export function createSupabaseClient() {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

  return createBrowserClient(url, key);
}

