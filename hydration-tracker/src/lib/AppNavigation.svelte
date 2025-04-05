<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { page } from "$app/stores";

  // Define types for props and state
  type User = {
    id: string;
    email: string;
    role: string;
    created_at: string;
  };

  // Using $props() for component props in runes mode
  let { user } = $props<{ user: User | null }>();

  // Using $ for reactive variables in runes mode
  let userRole = $state("user");
  let isLoading = $state(true);

  onMount(async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        userRole = data.role;
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        isLoading = false;
      }
    } else {
      isLoading = false;
    }
  });

  // Add type annotation for path parameter
  const isActive = (path: string): boolean => $page.url.pathname === path;
</script>

<nav class="app-nav">
  <div class="nav-container">
    <div class="brand">
      <a href="/" class="brand-link">Hydration Tracker</a>
    </div>

    {#if user && !isLoading}
      <div class="nav-links">
        <a href="/dashboard" class:active={isActive("/dashboard")}>Dashboard</a>

        {#if userRole === "admin"}
          <a href="/admin" class:active={isActive("/admin")}>Admin</a>
        {/if}

        <button
          class="logout-button"
          on:click={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) console.log("Error logging out:", error.message);
          }}
        >
          Logout
        </button>
      </div>
    {/if}
  </div>
</nav>

<style>
  .app-nav {
    background-color: #1e40af;
    color: white;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }

  .brand-link {
    font-weight: 700;
    font-size: 1.25rem;
    color: white;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .nav-links a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .nav-links a:hover,
  .nav-links a.active {
    color: white;
    border-bottom: 2px solid white;
  }

  .logout-button {
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .logout-button:hover {
    background-color: #dc2626;
  }
</style>
