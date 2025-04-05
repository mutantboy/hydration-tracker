import { redirect } from '@sveltejs/kit';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { ServerLoad } from '@sveltejs/kit';




interface Locals {
  supabase: SupabaseClient;
  getSession: () => Promise<Session | null>;
}

export const load = (async ({ locals }: { locals: Locals }) => {
  const { supabase, getSession } = locals;
  
  const session = await getSession();

  if (!session) {
    throw redirect(303, '/login');
  }

  // Check if user is admin
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || data?.role !== 'admin') {
    throw redirect(303, '/dashboard');
  }

  return {
    session
  };
}) satisfies ServerLoad;

