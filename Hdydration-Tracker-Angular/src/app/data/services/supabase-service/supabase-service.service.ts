import { Injectable, Signal, signal, computed } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
  Provider
} from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { Profile } from '../../model/profile';
import { HydrationEntry } from '../../model/entry';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  
  private _session = signal<AuthSession | null>(null);
  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal<boolean>(false);

  public isLoggedIn = computed(() => !!this._session());
  public isAdmin = computed(() => this._profile()?.role === 'admin');
  
  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'hydration-app-auth',
        detectSessionInUrl: true,
        flowType: 'pkce' //for OAuth
      }
    });
    
    this.loadSession();
    
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      this._session.set(session);
      this._user.set(session?.user || null);
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
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

  private async loadSession() {
    try {
      this._loading.set(true);
      const { data, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Session retrieval error:', error);
        this.clearState();
        return;
      }
      
      if (!data.session) {
        console.log('No active session found');
        this.clearState();
        return;
      }
      
      this._session.set(data.session);
      this._user.set(data.session.user || null);
      
      if (data.session.user) {
        await this.loadUserProfile(data.session.user.id);
      }
      
      console.log('Session loaded successfully:', !!data.session);
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearState();
    } finally {
      this._loading.set(false);
    }
  }

  public async loadUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      this._profile.set(data as Profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
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
      
      //console.log('Signup response data:', JSON.stringify(data, null, 2));
      
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
    
    console.log('Sign in successful, session:', data.session);
    console.log('Sign in successful, user:', data.user);
    
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
      return await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
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
  async updatePassword(newPassword: string) {
    this._loading.set(true);
    try {
      return await this.supabase.auth.updateUser({
        password: newPassword
      });
    } finally {
      this._loading.set(false);
    }
  }

  // Handle redirect from OAuth provider
  handleRedirect() {
    return this.supabase.auth.getSession();
  }

  private clearState() {
    this._session.set(null);
    this._user.set(null);
    this._profile.set(null);

    localStorage.clear();
    sessionStorage.clear();
  }
  
  async signOut() {
    this._loading.set(true);
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      this.clearState();
      return { error: null };
    } catch (error) {
      console.error('Error during sign out:', error);
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