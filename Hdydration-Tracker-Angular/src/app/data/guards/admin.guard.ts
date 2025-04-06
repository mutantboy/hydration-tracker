import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';


export const adminGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (!supabaseService.isAdmin()) {
    router.navigate(['/dashboard']);
    return false;
  }
  
  return true;
};
