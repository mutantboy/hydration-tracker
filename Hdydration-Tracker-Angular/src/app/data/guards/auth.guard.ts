import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  console.log('Auth guard executing, checking authentication...');

  if (supabaseService.isLoggedIn()) {
    console.log('Already logged in, proceeding');
    return true;
  }

  if (!supabaseService.initialized()) {
    console.log('Auth guard waiting for initialization');
    
    const { data } = await supabaseService._supabase.auth.getSession();
    
    if (data.session) {
      console.log('Found valid session, proceeding');
      return true;
    }
    
    console.log('No session found during guard check');
    router.navigate(['/auth']);
    return false;
  }

  if (!supabaseService.isLoggedIn()) {
    console.log('Auth guard: not logged in, redirecting to auth');
    router.navigate(['/auth']);
    return false;
  }
  
  return true;
};