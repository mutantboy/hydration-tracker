// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      getSession(): Promise<Session | null>;
    }
    interface PageData {
      session: Session | null;
      supabase: SupabaseClient;
    }
    // interface Error {}
    // interface Platform {}
  }
}

declare module '@sveltejs/kit' {
  interface PageLoad {
    session: Session | null;
    supabase: SupabaseClient;
  }
  interface PageServerLoad {
    session: Session | null;
  }
}

export {};
