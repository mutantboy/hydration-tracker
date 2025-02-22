<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import type { SupabaseClient, Session } from "@supabase/supabase-js";

  let { data, children } = $props<{
    data: {
      supabase: SupabaseClient;
      session: Session | null;
    };
    children: () => any;
  }>();
  let supabase = $state(data.supabase);
  let session = $state(data.session);

  $effect(() => {
    supabase = data.supabase;
    session = data.session;
  });

  onMount(() => {
    const { data: authData } = supabase.auth.onAuthStateChange(
      (_event: string, currentSession: Session | null) => {
        if (currentSession?.expires_at !== session?.expires_at) {
          invalidate("supabase:auth");
        }
      }
    );

    return () => {
      authData.subscription.unsubscribe();
    };
  });
</script>

{#if children}
  {@render children()}
{/if}
