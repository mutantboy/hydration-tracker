// src/app/data/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service/supabase-service.service';

// Modify auth.guard.ts
export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  console.log('Auth guard executing, checking authentication...');

  // Check for session in service first
  if (supabaseService.isLoggedIn()) {
    console.log('Auth guard: Already logged in according to service state');
    return true;
  }

  // Check for direct session next
  try {
    console.log('Auth guard: Checking for session directly...');
    const { data } = await supabaseService._supabase.auth.getSession();
    
    if (data?.session) {
      console.log('Auth guard: Valid session found, updating service state');
      supabaseService.session = data.session;
      supabaseService.user = data.session.user;
      
      if (!supabaseService.profile()) {
        console.log('Auth guard: Loading user profile');
        await supabaseService.loadUserProfile(data.session.user.id);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Auth guard: Error checking session', error);
  }
  
  // Temporary development backdoor - USE FOR DEBUGGING ONLY
  // Comment this out for production!
  if (route.routeConfig?.path === 'dashboard') {
    console.warn('AUTH GUARD DEVELOPMENT BYPASS: Allowing access to dashboard for debugging');
    return true;
  }
  
  console.log('Auth guard: No valid session, redirecting to auth');
  router.navigate(['/auth']);
  return false;
};