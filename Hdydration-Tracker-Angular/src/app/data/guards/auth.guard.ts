import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (!supabaseService.initialized()) {
    console.log('Auth guard waiting for initialization');
    let attempts = 0;
    
    while (!supabaseService.initialized() && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  if (!supabaseService.isLoggedIn()) {
    console.log('Auth guard: not logged in, redirecting to auth');
    router.navigate(['/auth']);
    return false;
  }
  
  return true;
};