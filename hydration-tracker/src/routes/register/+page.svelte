<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { ActionData } from "./$types";

  interface Props {
    form: ActionData;
  }

  let { form } = $props<Props>();
  let loading = $state(false);
  let password = $state("");
  let confirmPassword = $state("");
  let passwordsMatch = $derived(password === confirmPassword);

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    if (!passwordsMatch) {
      loading = false;
      return;
    }

    return async ({ update }: { update: () => Promise<void> }) => {
      loading = false;
      await update();
    };
  };
</script>

<form method="POST" use:enhance={handleSubmit} class="auth-form">
  <h1>Register</h1>

  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  <div class="form-group">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required />
  </div>

  <div class="form-group">
    <label for="password">Password</label>
    <input
      id="password"
      name="password"
      type="password"
      bind:value={password}
      required
    />
  </div>

  <div class="form-group">
    <label for="confirmPassword">Confirm Password</label>
    <input
      id="confirmPassword"
      type="password"
      bind:value={confirmPassword}
      required
    />
    {#if !passwordsMatch}
      <span class="error">Passwords do not match</span>
    {/if}
  </div>

  <button type="submit" disabled={loading || !passwordsMatch}>
    {loading ? "Loading..." : "Register"}
  </button>
</form>
