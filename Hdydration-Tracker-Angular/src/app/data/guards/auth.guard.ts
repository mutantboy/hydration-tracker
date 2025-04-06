import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (supabaseService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!supabaseService.isLoggedIn()) {
    router.navigate(['/auth']);
    return false;
  }
  
  return true;
};
