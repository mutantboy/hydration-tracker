<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  let error = $state<string | null>(null);

  $effect(() => {
    const timeout = setTimeout(() => {
      error = "Taking too long to load. Please refresh the page.";
    }, 5000);

    if ($page.data.session) {
      goto("/dashboard");
    } else {
      goto("/login");
    }

    return () => clearTimeout(timeout);
  });
</script>

<div class="loading">
  {#if error}
    <p class="error">{error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</div>

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  .error {
    color: red;
  }
</style>
