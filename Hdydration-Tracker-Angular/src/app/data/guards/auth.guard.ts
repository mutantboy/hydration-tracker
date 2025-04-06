import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  console.log('Auth guard executing, checking authentication...');

  if (!supabaseService.initialized()) {
    console.log('Auth guard waiting for initialization');
    let attempts = 0;
    
    while (!supabaseService.initialized() && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 150));
      attempts++;
    }
    
    if (!supabaseService.initialized()) {
      console.log('Service initialization timed out');
    }
  }

  try {
    // Try to refresh the session if possible
    console.log('Auth guard checking and refreshing session...');
    const { data, error } = await supabaseService._supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session in auth guard:', error);
      router.navigate(['/auth']);
      return false;
    }
    
    if (!data.session) {
      console.log('Auth guard: No active session found');
      router.navigate(['/auth']);
      return false;
    }
    
    if (!supabaseService.session()) {
      console.log('Auth guard: Session found but not in service, updating service state');
      await supabaseService.refreshSession(data.session);
    }
    
    console.log('Auth guard: User is authenticated');
    return true;
  } catch (e) {
    console.error('Auth guard exception:', e);
    router.navigate(['/auth']);
    return false;
  }
};