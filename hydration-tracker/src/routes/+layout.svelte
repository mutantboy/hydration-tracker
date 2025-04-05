<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import type { SupabaseClient, Session } from "@supabase/supabase-js";
  import AppNavigation from "$lib/AppNavigation.svelte";

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

    window.addEventListener("error", (event) => {
      if (
        event.message.includes("bootstrap-autofill") ||
        event.message.includes("bubble_compiled")
      ) {
        event.preventDefault();
        console.warn("Suppressed third-party script error:", event.message);
      }
    });

    return () => {
      authData.subscription.unsubscribe();
    };
  });
</script>

<div class="app-container">
  {#if session}
    <AppNavigation user={session.user} />
  {/if}

  <main class="content">
    {#if children}
      {@render children()}
    {/if}
  </main>
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
  }
</style>
