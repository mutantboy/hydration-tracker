<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";

  export let form: ActionData;

  let loading = false;

  const handleSubmit = () => {
    loading = true;
    return async ({ update }) => {
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
