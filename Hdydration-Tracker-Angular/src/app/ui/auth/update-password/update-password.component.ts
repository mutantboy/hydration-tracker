import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../data/services/supabase-service/supabase-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-password',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './update-password.component.html',
})
export class UpdatePasswordComponent implements OnInit {
  passwordForm: FormGroup;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);


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
      this.router.navigate(['/auth']);
    }
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async handleSubmit() {
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
    
    // Consider signing the user out after password change
    // if that's your desired behavior
    setTimeout(() => {
      this.supabaseService.signOut();
    }, 3000); // Give them 3 seconds to see the success message
  } catch (error: any) {
    this.errorMessage.set(error.message || 'An error occurred while updating your password');
  }
  }
}


