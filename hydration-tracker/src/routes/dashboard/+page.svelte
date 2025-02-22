<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";

  let { data } = $props();
  let { hydrationEntries } = data;
  let amount = $state(0);
  let loading = $state(false);

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }: { update: () => Promise<void> }) => {
      loading = false;
      await update();
    };
  };
</script>

<div class="dashboard">
  <h1>Hydration Tracker</h1>

  <div class="hydration-form">
    <form method="POST" use:enhance={handleSubmit}>
      <label>
        Amount (ml):
        <input
          type="number"
          name="amount"
          bind:value={amount}
          min="0"
          required
        />
      </label>
      <button type="submit" disabled={loading}> Add Entry </button>
    </form>
  </div>

  <div class="hydration-entries">
    <h2>Your Hydration History</h2>
    {#if hydrationEntries.length === 0}
      <p>No entries yet. Start tracking your water intake!</p>
    {:else}
      <ul>
        {#each hydrationEntries as entry}
          <li>
            {entry.amount}ml at {new Date(entry.created_at).toLocaleString()}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
