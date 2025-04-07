import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../data/services/supabase-service/supabase-service.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5;">
      <div style="text-align: center;">
        <h2>Processing Authentication...</h2>
        <div style="
          border: 4px solid rgba(0, 0, 0, 0.1); 
          border-radius: 50%; 
          border-top: 4px solid #2196f3; 
          width: 40px; 
          height: 40px; 
          margin: 20px auto; 
          animation: spin 1s linear infinite;
        "></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService, 
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Get the current session
      const { data } = await this.supabaseService._supabase.auth.getSession();
      
      if (data.session) {
        // Redirect to dashboard if session exists
        this.router.navigate(['/dashboard']);
      } else {
        // If no session, redirect to auth
        this.router.navigate(['/auth']);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/auth']);
    }
  }
}