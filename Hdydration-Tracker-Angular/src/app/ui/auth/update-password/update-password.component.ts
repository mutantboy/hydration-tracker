import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../data/services/supabase-service/supabase-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-password',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './update-password.component.html',
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-spinner {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      font-weight: bold;
    }
  `]
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
      const { data, error } = await this.supabaseService.updatePassword(this.passwordForm.value.password);
      
      if (error) throw error;
      
      this.successMessage.set('Password updated successfully!');
      this.passwordForm.reset();
      
      setTimeout(() => {
        this.supabaseService.signOut().then(() => {
          this.router.navigate(['/auth']);
        });
      }, 3000); 
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred while updating your password');
    }
  }
}


