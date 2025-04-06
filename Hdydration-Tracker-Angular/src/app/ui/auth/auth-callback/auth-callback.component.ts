import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../data/services/supabase-service/supabase-service.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: '<div class="loading">Processing login...</div>',
  styles: [`
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 18px;
      color: #666;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.handleRedirect();
  }

  async handleRedirect() {
    try {
      // Handle the OAuth redirect callback
      const { data, error } = await this.supabaseService.handleRedirect();
      if (error) throw error;
      
      // Check if we have a session
      if (data.session) {
        // Successfully authenticated, redirect to dashboard
        this.router.navigate(['/dashboard']);
      } else {
        // No session found, redirect to login
        this.router.navigate(['/auth']);
      }
    } catch (error) {
      console.error('Error handling auth redirect:', error);
      this.router.navigate(['/auth']);
    }
  }
}