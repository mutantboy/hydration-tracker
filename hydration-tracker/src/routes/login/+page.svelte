<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { ActionData } from "./$types";

  let { form } = $props();
  let loading = $state(false);

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }: { update: () => Promise<void> }) => {
      loading = false;
      await update();
    };
  };
</script>

<form method="POST" use:enhance={handleSubmit} class="auth-form">
  <h1>Sign In</h1>

  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  <div class="form-group">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required />
  </div>

  <div class="form-group">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required />
  </div>

  <button type="submit" disabled={loading}>
    {loading ? "Loading..." : "Sign In"}
  </button>
</form>
