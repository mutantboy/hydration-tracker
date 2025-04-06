import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../data/services/supabase-service/supabase-service.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  authMode = signal<'signup' | 'signin' | 'reset'>('signin');
  authForm: FormGroup;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  
  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.authForm.reset();
    //this.supabaseService.loading = false;

    // Check if user is already logged in
    if (this.supabaseService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async handleSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    if (this.authForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }
    
    const { email, password } = this.authForm.value;
    
    try {
      if (this.authMode() === 'signup') {
        await this.handleSignUp(email, password);
      } else if (this.authMode() === 'signin') {
        await this.handleSignIn(email, password);
      } else if (this.authMode() === 'reset') {
        await this.handlePasswordReset(email);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred');
    }
  }

  async handleSignUp(email: string, password: string) {
    try {
      const result = await this.supabaseService.signUp(email, password);
      
      // Check if user was created but verification is pending
      if (result?.user && !result.session) {
        this.successMessage.set('Registration successful! Please check your email to verify your account before signing in.');
        this.authMode.set('signin');
        return;
      }
      
      // Regular success case
      this.successMessage.set('Registration successful!');
      this.authMode.set('signin');
    } catch (error: any) {
      console.error('Signup error:', error);
      this.errorMessage.set(error.message || 'An error occurred during registration');
    }
  }

  async handleSignIn(email: string, password: string) {
    try {
      console.log('Handling sign in for:', email);
      const result = await this.supabaseService.signInWithEmail(email, password);
      
      if (!result?.user || !result?.session) {
        console.error('Sign in failed - no user or session returned');
        this.errorMessage.set('Sign in failed - no user or session returned');
        return;
      }
      
      console.log('Sign in successful, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Sign in error:', error);
      this.errorMessage.set(error.message || 'An error occurred while signing in');
    }
  }

  async handlePasswordReset(email: string) {
    const { error } = await this.supabaseService.resetPassword(email);
    if (error) throw error;
    this.successMessage.set('Password reset email sent! Please check your inbox.');
  }

  async signInWithGoogle() {
    try {
      const { error } = await this.supabaseService.signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error signing in with Google');
    }
  }

  switchMode(mode: 'signup' | 'signin' | 'reset') {
    this.authMode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    // Delay form rebuilding to give Angular time to detect changes
    setTimeout(() => {
      if (mode === 'reset') {
        this.authForm = this.fb.group({
          email: ['', [Validators.required, Validators.email]]
        });
      } else {
        this.authForm = this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required, Validators.minLength(6)]]
        });
      }
    }, 0);
  }
}