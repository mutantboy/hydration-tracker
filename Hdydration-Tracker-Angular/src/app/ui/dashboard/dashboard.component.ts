import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
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
  
  constructor() {
    // Use effect to respond to authentication state changes
    effect(() => {
      console.log('Dashboard effect - checking login status:', this.supabaseService.isLoggedIn());
      if (this.supabaseService.isLoggedIn()) {
        this.tryLoadEntries();
      }
    });
  }

  async ngOnInit() {
    console.log('Dashboard initializing...');
    this.loading.set(true);
    
    // Start a timer to ensure data gets loaded even if other mechanisms fail
    setTimeout(() => {
      if (this.entries().length === 0 && this.supabaseService.isLoggedIn()) {
        console.log('Trigger delayed entry loading');
        this.tryLoadEntries();
      }
    }, 3000);
  }

  async tryLoadEntries(force: boolean = false) {
    console.log('Attempting to load entries...');
    
    if (this.entries().length > 0 && !force) {
      console.log('Entries already loaded, skipping');
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    try {
      if (this.supabaseService.isLoggedIn() && !this.supabaseService.profile()) {
        console.log('User logged in but no profile, loading profile...');
        await this.supabaseService.loadUserProfile(this.supabaseService.user()!.id);
      }
      
      if (!this.supabaseService.isLoggedIn()) {
        console.warn('Not logged in when trying to load entries');
        return;
      }
      
      console.log('Loading entries from database...');
      const { data, error } = await this.supabaseService.getEntries();
      
      if (error) {
        console.error('Error loading entries:', error);
        this.error.set(error.message || 'Failed to load entries');
        return;
      }
      
      console.log('Entries loaded successfully:', data?.length || 0);
      this.entries.set(data as HydrationEntry[] || []);
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
      this.loading.set(true);
      console.log('Adding new entry with amount:', this.newAmount());
      
      const { error } = await this.supabaseService.createEntry(this.newAmount());
      
      if (error) throw error;
      
      this.newAmount.set(250); // Reset to default
      
      await this.tryLoadEntries(true);
      
      console.log('Entry added successfully');
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteEntry(id: number) {
    try {
      this.loading.set(true);
      console.log('Deleting entry with ID:', id);
      
      const { error } = await this.supabaseService.deleteEntry(id);
      
      if (error) throw error;
      
      await this.tryLoadEntries(true);
      
      console.log('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    } finally {
      this.loading.set(false);
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