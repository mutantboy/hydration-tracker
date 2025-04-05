<script lang="ts">
  import AdminDashboard from "$lib/components/adminDashboard.component.svelte";
  import AppNavigation from "$lib/AppNavigation.svelte";

  let { data } = $props();
  let user = data.session.user;
</script>

<div class="admin-page">
  <AppNavigation {user} />
  <AdminDashboard {user} />
</div>

<style>
  .admin-page {
    min-height: 100vh;
    background-color: #f5f7fb;
  }
</style>
