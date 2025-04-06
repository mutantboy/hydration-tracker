import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../data/services/supabase-service/supabase-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container">
      <div class="loading-message">
        <div class="spinner"></div>
        <p>{{ statusMessage }}</p>
      </div>
      
      <!-- Debug Button -->
      <button *ngIf="showDebugButton" 
              (click)="manualRedirect()" 
              style="margin-top: 20px; padding: 10px 15px; background-color: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Manual Redirect to Dashboard
      </button>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    
    .loading-message {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
    }
    
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid #2196f3;
      width: 40px;
      height: 40px;
      margin: 0 auto 1rem;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  statusMessage: string = 'Processing login...';
  showDebugButton: boolean = true;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.handleRedirect();
    
    // Safety timeout - if we're still on this page after 10 seconds, show debug button
    setTimeout(() => {
      if (this.statusMessage.includes('Exchanging')) {
        this.statusMessage = 'Sign-in is taking longer than expected...';
        this.showDebugButton = true;
      }
    }, 10000);
  }

  async handleRedirect() {
    try {
      // Get the URL params
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      
      if (!code) {
        console.error('No code found in callback URL');
        this.statusMessage = 'Authentication error: No code found';
        setTimeout(() => this.router.navigate(['/auth']), 2000);
        return;
      }
      
      console.log('Processing OAuth callback with code:', code);
      
      // First check if we're already logged in
      const { data: sessionData } = await this.supabaseService._supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('Already have a session, redirecting to dashboard');
        this.statusMessage = 'Already authenticated! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        return;
      }
      
      this.statusMessage = 'Exchanging code for session...';
      
      try {
        // Exchange code for session
        const { data, error } = await this.supabaseService._supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          this.statusMessage = 'Authentication error: ' + error.message;
          setTimeout(() => this.router.navigate(['/auth']), 2000);
          return;
        }
        
        console.log('Session established:', !!data.session);
        this.statusMessage = 'Authentication successful! Redirecting...';
        
        // Force a window reload to ensure the new auth state is fully recognized
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Exception during code exchange:', err);
        this.statusMessage = 'An unexpected error occurred during authentication';
        setTimeout(() => this.router.navigate(['/auth']), 2000);
      }
    } catch (error) {
      console.error('Error handling auth redirect:', error);
      this.statusMessage = 'Authentication process failed';
      setTimeout(() => this.router.navigate(['/auth']), 2000);
    }
  }

  // Manual redirect button for when automatic redirect fails
  manualRedirect() {
    console.log('Manual redirect to dashboard triggered');
    window.location.href = '/dashboard';
  }
}