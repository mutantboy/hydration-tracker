<script lang="ts">
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import type { ActionData } from "./$types";

  let { form, data } = $props();
  let loading = $state(false);

  // Get the supabase client from data
  const { supabase } = data;

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }: { update: () => Promise<void> }) => {
      loading = false;
      await update();
    };
  };

  // Function to handle OAuth login
  const handleOAuthLogin = async (provider: "google") => {
    try {
      loading = true;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error with OAuth login:", error);
      alert("Error with OAuth login. Please try again.");
    } finally {
      loading = false;
    }
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

  <div class="oauth-separator">
    <hr />
    <span>or sign in with</span>
    <hr />
  </div>

  <div class="oauth-buttons">
    <button
      type="button"
      on:click={() => handleOAuthLogin("google")}
      disabled={loading}
      class="google-button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        />
      </svg>
      Google
    </button>
  </div>

  <div class="register-link">
    <p>Don't have an account? <a href="/register">Register</a></p>
  </div>
</form>

<style>
  .auth-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background-color: white;
  }

  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    font-size: 1rem;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: #2563eb;
  }

  button:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }

  .error {
    color: #ef4444;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #fee2e2;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .oauth-separator {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    gap: 0.5rem;
  }

  .oauth-separator hr {
    flex-grow: 1;
    border: none;
    height: 1px;
    background-color: #e2e8f0;
  }

  .oauth-separator span {
    color: #64748b;
    font-size: 0.875rem;
  }

  .oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .google-button,
  .github-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: white;
    color: #1f2937;
    border: 1px solid #e2e8f0;
    transition: background-color 0.2s;
  }

  .google-button:hover,
  .github-button:hover {
    background-color: #f8fafc;
  }

  .register-link {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: #64748b;
  }

  .register-link a {
    color: #3b82f6;
    text-decoration: underline;
  }
</style>
