import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

interface Locals {
  supabase: SupabaseClient;
  getSession: () => Promise<Session | null>;
}

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }: { locals: Locals }) => {
  const session = await getSession();

  if (!session) {
    return {
      hydrationEntries: [],
      supabase
    };
  }

  const { data: hydrationEntries } = await supabase
    .from('hydration_entries')
    .select('*')
    .order('created_at', { ascending: false });

  return {
    hydrationEntries: hydrationEntries ?? [],
    supabase
  };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, getSession } }: { 
    request: Request;
    locals: Locals;
  }) => {
    const session = await getSession();
    
    if (!session) {
      return fail(401, {
        error: 'You must be logged in to add entries'
      });
    }

    const formData = await request.formData();
    const amount = formData.get('amount');

    const { error } = await supabase
      .from('hydration_entries')
      .insert([
        {
          user_id: session.user.id,
          amount: Number(amount)
        }
      ]);

    if (error) {
      return fail(500, {
        error: 'Failed to add entry'
      });
    }

    return { success: true };
  }
};