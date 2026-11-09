import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { clientEnv, serverEnv } from '@/lib/env';

export function getAdminClient() {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = serverEnv.SUPABASE_SECRET_KEY || 'placeholder-service-key';

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

