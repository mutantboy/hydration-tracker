import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService} from '../../data/services/supabase-service/supabase-service.service';
import { HydrationEntry } from '../../data/model/entry';
import { Router } from 'express';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  entries = signal<HydrationEntry[]>([]);
  newAmount = signal<number>(0);
  
  // Computed values
  dailyTotal = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.entries()
      .filter(entry => new Date(entry.created_at).toISOString().split('T')[0] === today)
      .reduce((sum, entry) => sum + entry.amount, 0);
  });
  
  dailyPercentage = computed(() => {
    return Math.min(Math.round(this.dailyTotal() / 2500 * 100), 100);
  });

  public supabaseService = inject(SupabaseService);      // public so we can use it in the template
  public router = inject(Router);
  
  constructor() {}

  ngOnInit() {
    this.loadEntries();
  }

  async loadEntries() {
    try {
      const { data, error } = await this.supabaseService.getEntries();
      
      if (error) throw error;
      
      this.entries.set(data as HydrationEntry[]);
    } catch (error) {
      console.error('Error loading entries:', error);
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
      
      this.newAmount.set(0);
      await this.loadEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    }
  }

  async deleteEntry(id: number) {
    try {
      const { error } = await this.supabaseService.deleteEntry(id);
      
      if (error) throw error;
      
      await this.loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  }

  async signOut() {
    try {
      await this.supabaseService.signOut();
      
      // Force navigation to auth page
      this.router.navigate(['/auth'], { replaceUrl: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}