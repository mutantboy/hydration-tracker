<script lang="ts">
  import { page } from "$app/stores";
  import { redirect } from "@sveltejs/kit";

  $effect(() => {
    if ($page.data.session) {
      redirect(303, "/dashboard");
    } else {
      redirect(303, "/login");
    }
  });
</script>

<div class="loading">
  <p>Loading...</p>
</div>

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
</style>
