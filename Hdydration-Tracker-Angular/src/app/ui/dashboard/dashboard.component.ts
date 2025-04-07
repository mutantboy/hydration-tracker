import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../data/services/supabase-service/supabase-service.service';
import { HydrationEntry } from '../../data/model/entry';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  entries = signal<HydrationEntry[]>([]);
  newAmount = signal<number>(250);
  loading = signal<boolean>(true);
  
  public supabaseService = inject(SupabaseService);
  public router = inject(Router);

  dailyTotal = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entries()
      .filter(entry => {
        const entryDate = new Date(entry.created_at).toISOString().split('T')[0];
        return entryDate === today;
      })
      .reduce((sum, entry) => sum + entry.amount, 0);
  });
  
  dailyPercentage = computed(() => {
    return Math.min(Math.round(this.dailyTotal() / 2500 * 100), 100);
  });

  async ngOnInit() {
    // Ensure user is logged in
    if (!this.supabaseService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Load entries
    await this.loadEntries();
  }

  async loadEntries() {
    try {
      this.loading.set(true);
      const { data, error } = await this.supabaseService.getEntries();
      
      if (error) throw error;
      
      this.entries.set(data as HydrationEntry[]);
    } catch (error) {
      console.error('Error loading entries:', error);
      // Optionally show an error message to the user
    } finally {
      this.loading.set(false);
    }
  }

  async addEntry(amount?: number) {
    // Use the provided amount or the current newAmount
    const entryAmount = amount || this.newAmount();
    
    if (entryAmount <= 0) return;
    
    try {
      this.loading.set(true);
      const { data, error } = await this.supabaseService.createEntry(entryAmount);
      
      if (error) throw error;
      
      if (data) {
        this.entries.update(currentEntries => [data as HydrationEntry, ...currentEntries]);
      }
      
      // Reset newAmount to 250 only if no specific amount was provided
      if (!amount) {
        this.newAmount.set(250);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    } finally {
      this.loading.set(false);
    }
  }

  setNewAmount(amount: number) {
    this.newAmount.set(amount);
  }

  async deleteEntry(id: number) {
    try {
      this.loading.set(true);
      const { error } = await this.supabaseService.deleteEntry(id);
      
      if (error) throw error;
      
      this.entries.update(currentEntries => 
        currentEntries.filter(entry => entry.id !== id)
      );
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async signOut() {
    await this.supabaseService.signOut();
  }
}