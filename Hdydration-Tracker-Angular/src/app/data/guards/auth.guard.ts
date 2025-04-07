import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';

export const authGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Simple, direct check
  if (supabaseService.isLoggedIn()) {
    return true;
  }

  // Redirect to auth if not logged in
  router.navigate(['/auth']);
  return false;
};