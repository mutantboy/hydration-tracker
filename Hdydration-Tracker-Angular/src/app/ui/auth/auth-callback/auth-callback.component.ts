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
        
        <!-- Spinner -->
        <div style="border: 4px solid rgba(0, 0, 0, 0.1); border-radius: 50%; border-top: 4px solid #2196f3; width: 40px; height: 40px; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
        
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
  message: string = 'Processing your authentication...';
  
  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    console.log('Auth callback component initialized');
    
    try {
      // Simple redirect approach - let Supabase SDK handle everything
      console.log('Redirecting to dashboard after brief delay');
      
      // Delay to ensure browser completes any processing
      setTimeout(() => {
        this.message = 'Authentication complete! Redirecting...';
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Error in auth callback:', error);
      this.message = 'An error occurred during authentication. Redirecting...';
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    }
  }
}