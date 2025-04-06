import { Injectable, Signal, signal, computed, inject, booleanAttribute } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { Profile } from '../../model/profile';
import { HydrationEntry } from '../../model/entry';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private router = inject(Router);
  
  // State signals
  private _session = signal<AuthSession | null>(null);
  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);

  // Computed values
  public isLoggedIn = computed(() => !!this._session());
  public isAdmin = computed(() => this._profile()?.role === 'admin');
  
  constructor() {
    const storageKey = 'hydration-app-auth';
  
    const customStorage = {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    };

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'hydration-app-auth',
        detectSessionInUrl: true,
        flowType: 'pkce' //for OAuth
      }
    });
    
    // Initialize the service
    this.initialize();
    
    // Set up auth state change listener
    // In supabase-service.service.ts
this.supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, !!session);
  
  // Important: Don't process auth events during an active OAuth callback
  const url = new URL(window.location.href);
    if (url.pathname.includes('/auth/callback')) {
      console.log('Ignoring auth state change during callback processing');
      return;
    }
    
    // Update session and user state
    this._session.set(session);
    this._user.set(session?.user || null);
    
    // Update profile if we have a user
    if (session?.user) {
      await this.loadUserProfile(session.user.id);
    } else {
      this._profile.set(null);
    }
    
    // Handle authentication events
    if (event === 'SIGNED_OUT') {
      console.log('User signed out, redirecting to auth page');
      this.router.navigate(['/auth']);
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log('User signed in or token refreshed, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    }
  });
  }

  // Public getters
  get _supabase(): SupabaseClient {
    return this.supabase;
  }

  get session(): Signal<AuthSession | null> {
    return this._session.asReadonly();
  }

  get user(): Signal<User | null> {
    return this._user.asReadonly();
  }

  get profile(): Signal<Profile | null> {
    return this._profile.asReadonly();
  }

  get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  get initialized(): Signal<boolean> {
    return this._initialized.asReadonly();
  }

  set loading(loading: boolean) {
    this._loading.set(loading);
  }

  // Initialize the service and get the current session
private async initialize() {
  this._loading.set(true);
  try {
    console.log('Initializing SupabaseService');
    
    const { data, error } = await this.supabase.auth.refreshSession();
    
    if (error) {
      console.log('No active session found or error refreshing', error?.message);
      const sessionResult = await this.supabase.auth.getSession();
      if (sessionResult.error || !sessionResult.data.session) {
        console.log('No active session available');
        this.clearState();
        this._initialized.set(true);
        this._loading.set(false);
        return;
      }
      
      console.log('Session retrieved from getSession');
      this._session.set(sessionResult.data.session);
      this._user.set(sessionResult.data.session.user);
    } else {
      console.log('Session refreshed successfully');
      this._session.set(data.session);
      this._user.set(data.session?.user || null);
    }
    
    if (this._user()) {
      try {
        console.log('Loading user profile...');
        const profileData = await this.loadUserProfile(this._user()!.id);
        console.log('Profile loaded:', !!profileData);
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
    
  } catch (e) {
    console.error('Fatal error during initialization:', e);
    this.clearState();
  } finally {
    this._loading.set(false);
    this._initialized.set(true);
    console.log('Service initialization complete. Logged in:', this.isLoggedIn());
  }
}

  // Load user profile
  public async loadUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }
      
      this._profile.set(data as Profile);
      return data;
    } catch (error) {
      console.error('Exception loading profile:', error);
      return null;
    }
  }

  async refreshSession(session?: AuthSession): Promise<boolean> {
    try {
      this._loading.set(true);
      
      if (session) {
        console.log('Refreshing with provided session');
        this._session.set(session);
        this._user.set(session.user);
        
        if (session.user) {
          await this.loadUserProfile(session.user.id);
        }
        
        return true;
      } else {
        console.log('No session provided, attempting to get current session');
        const { data, error } = await this.supabase.auth.getSession();
        
        if (error || !data.session) {
          console.log('No active session found during refresh');
          return false;
        }
        
        this._session.set(data.session);
        this._user.set(data.session.user);
        
        if (data.session.user) {
          await this.loadUserProfile(data.session.user.id);
        }
        
        return true;
      }
    } catch (e) {
      console.error('Error refreshing session:', e);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  // Clear state
  private clearState() {
    console.log('Clearing authentication state');
    this._session.set(null);
    this._user.set(null);
    this._profile.set(null);

    localStorage.clear();
    sessionStorage.clear();
  }

  // Email/Password Sign Up
  async signUp(email: string, password: string) {
    this._loading.set(true);
    try {
      console.log('Attempting signup with email:', email);
      const response = await this.supabase.auth.signUp({
        email,
        password
      });
      
      const { data, error } = response;
      
      if (error) {
        console.error('Signup API error:', error);
        throw error;
      }
      
      if (data?.user && !data?.session) {
        console.log('User created but no session - likely needs email confirmation');
      }
      
      return data;
    } catch (e) {
      console.error('Signup exception:', e);
      throw e;
    } finally {
      this._loading.set(false);
    }
  }

  // Email/Password Sign In
  async signInWithEmail(email: string, password: string) {
    this._loading.set(true);
    try {
      console.log('Starting sign in with:', email);
      const response = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      const { data, error } = response;
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful');
      
      return data;
    } catch (error) {
      console.error('Sign in exception:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  // Google OAuth sign in
  async signInWithGoogle() {
    this._loading.set(true);
    try {
      console.log('Starting Google sign-in flow');
      
      // Let Supabase handle the entire OAuth flow
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Error starting Google OAuth flow:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Exception during Google sign-in:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  // Password reset request
  async resetPassword(email: string) {
    this._loading.set(true);
    try {
      return await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      });
    } finally {
      this._loading.set(false);
    }
  }

  // Update password
  // Update password
async updatePassword(newPassword: string) {
  this._loading.set(true);
  try {
    console.log('Updating password...');
    const result = await this.supabase.auth.updateUser({
      password: newPassword
    });
    
    console.log('Password update result:', result.error ? 'Error' : 'Success');
    
    if (result.error) {
      throw result.error;
    }
    
    return result;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  // Handle redirect from OAuth provider
  handleRedirect() {
    return this.supabase.auth.getSession();
  }

  // Sign out
  async signOut() {
    this._loading.set(true);
    try {
      console.log('Signing out user');
      
      // Clear local storage first to ensure clean state
      localStorage.removeItem('hydration-app-auth');
      sessionStorage.removeItem('hydration-app-auth');
      
      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        throw error;
      }
      
      // Clear local state
      this.clearState();
      
      return { success: true };
    } catch (error) {
      console.error('Exception during sign out:', error);
      return { error };
    } finally {
      this._loading.set(false);
    }
  }

  // Create hydration entry
  async createEntry(amount: number) {
    const userId = this._user()?.id;
    if (!userId) throw new Error('User not authenticated');

    this._loading.set(true);
    try {
      const entry = {
        user_id: userId,
        amount,
        created_at: new Date(),
      };
      
      return await this.supabase.from('hydration_entries').insert(entry);
    } finally {
      this._loading.set(false);
    }
  }

  // Get user's hydration entries
  async getEntries() {
    const userId = this._user()?.id;
    if (!userId) throw new Error('User not authenticated');

    this._loading.set(true);
    try {
      return await this.supabase
        .from('hydration_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } finally {
      this._loading.set(false);
    }
  }

  // Update hydration entry
  async updateEntry(entry: Partial<HydrationEntry> & { id: number }) {
    const userId = this._user()?.id;
    if (!userId) throw new Error('User not authenticated');

    this._loading.set(true);
    try {
      const update = {
        ...entry,
        updated_at: new Date(),
      };
      
      return await this.supabase
        .from('hydration_entries')
        .update(update)
        .eq('id', entry.id)
        .eq('user_id', userId);
    } finally {
      this._loading.set(false);
    }
  }

  // Delete hydration entry
  async deleteEntry(id: number) {
    const userId = this._user()?.id;
    if (!userId) throw new Error('User not authenticated');

    this._loading.set(true);
    try {
      return await this.supabase
        .from('hydration_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } finally {
      this._loading.set(false);
    }
  }

  // Admin: Get all users' entries
  async getAllEntries() {
    if (!this.isAdmin()) {
      throw new Error('Unauthorized - Admin privileges required');
    }
    
    this._loading.set(true);
    try {
      return await this.supabase
        .from('hydration_entries')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });
    } finally {
      this._loading.set(false);
    }
  }
}