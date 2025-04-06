import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../data/services/supabase-service/supabase-service.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
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
  passwordForm!: FormGroup;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  updateInProgress = signal<boolean>(false);
  
  private fb = inject(FormBuilder);
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  
  constructor() {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.checkPasswords });
  }

  ngOnInit() {
    if (!this.supabaseService.isLoggedIn()) {
      console.log('Not logged in, redirecting to auth page');
      this.router.navigate(['/auth']);
      return;
    }
    
    if (!this.supabaseService.profile() && this.supabaseService.user()) {
      this.supabaseService.loadUserProfile(this.supabaseService.user()!.id);
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
      this.successMessage.set('Updating password...');
      
      const { data, error } = await this.supabaseService.updatePassword(this.passwordForm.value.password);
      
      if (error) throw error;
      
      this.passwordForm.reset();
      this.successMessage.set('Password updated successfully! You will be redirected to login in 3 seconds.');
      
      setTimeout(async () => {
        await this.supabaseService.signOut();
        window.location.href = '/auth';
      }, 3000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred while updating your password');
      this.successMessage.set(null);
    }
  }
  
  resetLoadingState() {
    location.reload();
  }

  forceSignOut() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/auth';
  }
}