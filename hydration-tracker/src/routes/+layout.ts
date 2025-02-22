import type { Load } from '@sveltejs/kit';
import { createBrowserClient } from '@supabase/ssr';

export const load: Load = async ({ depends }) => {
  depends('supabase:auth');

  const supabase = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { supabase, session };
};