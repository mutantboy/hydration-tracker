<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
  let { supabase, session } = data;

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      invalidate("supabase:auth");
    });

    return () => subscription.unsubscribe();
  });
</script>

<div class="container">
  <slot {data} />
</div>
