import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService} from '../../data/services/supabase-service/supabase-service.service';
import { HydrationEntry } from '../../data/model/entry';
import { Subscription } from '@supabase/supabase-js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  entries = signal<HydrationEntry[]>([]);
  newAmount = signal<number>(250); // Default to 250ml
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  dailyTotal = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entries()
      .filter(entry => new Date(entry.created_at).toISOString().split('T')[0] === today)
      .reduce((sum, entry) => sum + entry.amount, 0);
  });
  
  dailyPercentage = computed(() => {
    return Math.min(Math.round(this.dailyTotal() / 2500 * 100), 100);
  });

  public supabaseService = inject(SupabaseService);
  public router = inject(Router);

  private authSubscription: { data: { subscription: any } } | null = null;

  
  constructor() {}

  async ngOnInit() {
    console.log('Dashboard initializing...');
    this.loading.set(true);
    
    if (!this.supabaseService.initialized()) {
      console.log('Waiting for service initialization...');
      let attempts = 0;
      
      while (!this.supabaseService.initialized() && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
    }
    
    if (this.supabaseService.isLoggedIn()) {
      if (!this.supabaseService.profile()) {
        console.log('User logged in but no profile, loading profile...');
        await this.supabaseService.loadUserProfile(this.supabaseService.user()!.id);
      }
      
      console.log('User authenticated, loading entries...');
      await this.tryLoadEntries();
    } else {
      console.log('User not authenticated, redirecting to auth...');
      this.router.navigate(['/auth']);
    }
    
    this.authSubscription = this.supabaseService._supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session);
        if (session) {
          this.tryLoadEntries();
        } else {
          this.router.navigate(['/auth']);
        }
      }
    );
  }
  
  ngOnDestroy() {
    if (this.authSubscription?.data?.subscription) {
      this.authSubscription.data.subscription.unsubscribe();
    }
  }
 

  async tryLoadEntries() {
    this.loading.set(true);
    this.error.set(null);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!this.supabaseService.isLoggedIn()) {
      console.log('Not logged in, redirecting...');
      this.router.navigate(['/auth']);
      return;
    }
    
    try {
      console.log('Loading entries...');
      const { data, error } = await this.supabaseService.getEntries();
      
      if (error) {
        console.error('Error loading entries:', error);
        this.error.set(error.message || 'Failed to load entries');
        return;
      }
      
      console.log('Entries loaded:', data?.length || 0);
      this.entries.set(data as HydrationEntry[]);
    } catch (err: any) {
      console.error('Exception loading entries:', err);
      this.error.set(err.message || 'An unexpected error occurred');
    } finally {
      this.loading.set(false);
    }
  }

  setNewAmount(amount: number) {
    this.newAmount.set(amount);
  }

  async addEntry() {
    if (this.newAmount() <= 0) return;
    
    try {
      const { error } = await this.supabaseService.createEntry(this.newAmount());
      
      if (error) throw error;
      
      this.newAmount.set(250); // Reset to default
      await this.tryLoadEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    }
  }

  async deleteEntry(id: number) {
    try {
      const { error } = await this.supabaseService.deleteEntry(id);
      
      if (error) throw error;
      
      await this.tryLoadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  }

  async signOut() {
    try {
      await this.supabaseService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      this.router.navigate(['/auth']);
    }
  }
}