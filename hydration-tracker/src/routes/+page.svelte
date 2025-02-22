<script lang="ts">
  import { page } from "$app/stores";
  import AuthForm from "$lib/AuthForm.svelte";
  import HydrationTracker from "$lib/HydrationTracker.svelte";
</script>

{#if !$page.data.session}
  <AuthForm />
{:else}
  <HydrationTracker />
{/if}
