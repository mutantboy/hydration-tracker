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
    console.log('Auth guard: Not logged in, redirecting to auth');
    router.navigate(['/auth']);
    return false;
  }
  
  if (!supabaseService.profile() && supabaseService.user()) {
    console.log('Auth guard: Missing profile, attempting to load');
    try {
      await supabaseService.loadUserProfile(supabaseService.user()!.id);
    } catch (error) {
      console.error('Failed to load profile in guard:', error);
    }
  }
  
  return true;
};