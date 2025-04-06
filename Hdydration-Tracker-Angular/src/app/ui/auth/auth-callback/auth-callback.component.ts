import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../data/services/supabase-service/supabase-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px;">
        <h1 style="margin-bottom: 1rem; color: #2196f3;">Authentication</h1>
        <p style="margin-bottom: 1.5rem; color: #666;">{{ message }}</p>
        
        <div style="border: 4px solid rgba(0, 0, 0, 0.1); border-radius: 50%; border-top: 4px solid #2196f3; width: 40px; height: 40px; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
        
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        
        <div *ngIf="showDebug">
          <hr style="margin: 20px 0;" />
          <h3>Debug Info</h3>
          <pre style="text-align: left; background: #f1f1f1; padding: 10px; overflow: auto; max-height: 200px;">{{ debugInfo }}</pre>
          <button (click)="forceRedirect()" style="margin-top: 10px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Force Redirect to Dashboard
          </button>
        </div>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  message: string = 'Processing your authentication...';
  debugInfo: string = '';
  showDebug: boolean = true; // Set to true to show debug information
  
  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    try {
      this.addDebug('Auth callback component initialized');
      
      // Extract hash parameters from URL if present
      const hashParams = this.getHashParams();
      this.addDebug('URL hash params: ' + JSON.stringify(hashParams));
      
      // Check for error in hash
      if (hashParams['error']) {
        this.message = `Auth error: ${hashParams['error_description'] || hashParams['error']}`;
        this.addDebug('Error from hash: ' + this.message);
        setTimeout(() => window.location.href = '/auth', 3000);
        return;
      }
      
      // Skip the Supabase SDK's handling and directly try to get session
      this.addDebug('Fetching current session...');
      const { data, error } = await this.supabaseService._supabase.auth.getSession();
      
      if (error) {
        this.message = 'Error retrieving session';
        this.addDebug('Session error: ' + JSON.stringify(error));
        setTimeout(() => window.location.href = '/auth', 3000);
        return;
      }
      
      if (!data.session) {
        this.message = 'No session found after OAuth login';
        this.addDebug('No session data found');
        setTimeout(() => window.location.href = '/auth', 3000);
        return;
      }
      
      // We have a session, ensure it's stored in the service
      this.addDebug('Session found: User ID = ' + data.session.user.id);
      await this.supabaseService.refreshSession(data.session);
      
      // Load user profile
      try {
        this.addDebug('Loading user profile...');
        const profile = await this.supabaseService.loadUserProfile(data.session.user.id);
        this.addDebug('Profile loaded: ' + (profile ? 'success' : 'null'));
      } catch (profileError) {
        this.addDebug('Error loading profile: ' + JSON.stringify(profileError));
      }
      
      // Redirect to dashboard using direct navigation to avoid routing issues
      this.message = 'Authentication complete! Redirecting...';
      this.addDebug('Redirecting to dashboard in 2 seconds...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      this.message = 'Authentication process error';
      this.addDebug('Uncaught error: ' + JSON.stringify(error));
      setTimeout(() => window.location.href = '/auth', 3000);
    }
  }
  
  // Parse URL hash parameters
  private getHashParams(): Record<string, string> {
    const hash = window.location.hash.substring(1);
    const result: Record<string, string> = {};
    
    if (!hash) return result;
    
    hash.split('&').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        result[key] = decodeURIComponent(value);
      }
    });
    
    return result;
  }
  
  // Add debug information
  private addDebug(message: string) {
    console.log('[Auth Callback]', message);
    this.debugInfo += message + '\n';
  }
  
  // Force redirect to dashboard
  forceRedirect() {
    window.location.href = '/dashboard';
  }
}