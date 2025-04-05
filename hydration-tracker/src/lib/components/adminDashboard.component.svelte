<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";

  type User = {
    id: string;
    email: string;
    role: string;
    created_at: string;
  };

  // Updated to reflect that profiles might be an array
  type HydrationEntry = {
    id: number;
    amount: number;
    created_at: string;
    user_id: string;
    profiles: any; // Using any to handle potential array or object structure
  };

  let user = $props<{ user: User }>();

  let users = $state<User[]>([]);
  let userEntries = $state<HydrationEntry[]>([]);
  let isLoading = $state(true);
  let userRole = $state<string | null>(null);
  let error = $state<string | null>(null);

  onMount(async () => {
    // First, check if the current user is an admin
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      userRole = profileData.role;

      // If not admin, redirect to dashboard
      if (userRole !== "admin") {
        error = "You don't have permission to access this page";
        setTimeout(() => {
          goto("/dashboard");
        }, 3000);
        return;
      }

      // Fetch all users with their profiles
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (userError) throw userError;
      users = userData as User[];

      // Fetch hydration entries for all users (admin can see all)
      const { data: entriesData, error: entriesError } = await supabase
        .from("hydration_entries")
        .select(
          `
              id,
              amount, 
              created_at,
              user_id,
              profiles(email)
            `
        )
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      // No need for complex mapping - just store as is
      userEntries = entriesData as HydrationEntry[];

      isLoading = false;
    } catch (e: any) {
      console.error("Error fetching admin data:", e);
      error = e.message;
      isLoading = false;
    }
  });

  // Helper function to get email from profiles (handles both array and object)
  function getEmailFromProfiles(profiles: any): string {
    if (!profiles) return "Unknown";

    // If it's an array
    if (Array.isArray(profiles)) {
      return profiles.length > 0 && profiles[0].email
        ? profiles[0].email
        : "Unknown";
    }

    // If it's an object
    return profiles.email || "Unknown";
  }

  function updateUserRole(userId: string, newRole: string) {
    return async () => {
      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", userId);

        if (updateError) throw updateError;

        // Update local state
        users = users.map((user) => {
          if (user.id === userId) {
            return { ...user, role: newRole };
          }
          return user;
        });
      } catch (e: any) {
        console.error("Error updating user role:", e);
        error = e.message;
      }
    };
  }

  function deleteEntry(entryId: number) {
    return async () => {
      try {
        const { error: deleteError } = await supabase
          .from("hydration_entries")
          .delete()
          .eq("id", entryId);

        if (deleteError) throw deleteError;

        // Update local state
        userEntries = userEntries.filter((entry) => entry.id !== entryId);
      } catch (e: any) {
        console.error("Error deleting entry:", e);
        error = e.message;
      }
    };
  }
</script>

<div class="admin-dashboard">
  <h1>Admin Dashboard</h1>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  {#if isLoading}
    <div class="loading">Loading admin data...</div>
  {:else if userRole === "admin"}
    <div class="dashboard-sections">
      <section class="user-management">
        <h2>User Management</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.created_at).toLocaleString()}</td>
                  <td>
                    <select
                      value={user.role}
                      on:change={(e) =>
                        updateUserRole(
                          user.id,
                          (e.target as HTMLSelectElement).value
                        )()}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <section class="entry-management">
        <h2>All Hydration Entries</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount (ml)</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each userEntries as entry}
                <tr>
                  <td>{getEmailFromProfiles(entry.profiles)}</td>
                  <td>{entry.amount}</td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>
                    <button class="delete-btn" on:click={deleteEntry(entry.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .admin-dashboard {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
    color: #334155;
  }

  h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    color: #334155;
  }

  .dashboard-sections {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 1024px) {
    .dashboard-sections {
      grid-template-columns: 1fr 1fr;
    }
  }

  .table-container {
    overflow-x: auto;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #475569;
  }

  tr:hover {
    background-color: #f1f5f9;
  }

  .error-message {
    background-color: #fee2e2;
    color: #b91c1c;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    background-color: white;
  }

  .delete-btn {
    background-color: #ef4444;
    color: white;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .delete-btn:hover {
    background-color: #dc2626;
  }
</style>
