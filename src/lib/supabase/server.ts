import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'Supabase not configured. David will work with limited functionality.'
    );
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}
