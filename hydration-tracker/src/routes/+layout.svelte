<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import type { SupabaseClient } from "@supabase/supabase-js";
  import type { Session } from "@supabase/supabase-js";

  type PageData = {
    supabase: SupabaseClient;
    session: Session | null;
  };

  let { data } = $props<{ data: PageData }>();
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

{@render $$slots.default()}
