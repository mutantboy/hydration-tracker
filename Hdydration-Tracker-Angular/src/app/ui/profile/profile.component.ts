import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../data/services/supabase-service/supabase-service.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  passwordForm: FormGroup;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private router = inject(Router);
  public supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);


  constructor() {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.checkPasswords });
  }

  ngOnInit() {
    if (!this.supabaseService.isLoggedIn()) {
      console.log('Not logged in, redirecting to auth');
      this.router.navigate(['/auth']);
      return;
    }
    
    // Check if profile exists
    if (!this.supabaseService.profile()) {
      console.log('No profile data, attempting to reload profile');
      // Try to reload the profile if we have a user ID but no profile
      if (this.supabaseService.user()) {
        this.supabaseService.loadUserProfile(this.supabaseService.user()!.id);
      }
    }
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async updatePassword() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    if (this.passwordForm.invalid) {
      return;
    }
    
    try {
      const { error } = await this.supabaseService.updatePassword(this.passwordForm.value.password);
      
      if (error) throw error;
      
      this.successMessage.set('Password updated successfully!');
      this.passwordForm.reset();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred while updating your password');
    }
  }
}