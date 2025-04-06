import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../data/services/supabase-service/supabase-service.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  entries = signal<any[]>([]);
  public supabaseService = inject(SupabaseService);

  ngOnInit() {
    this.loadAllEntries();
  }

  async loadAllEntries() {
    try {
      const { data, error } = await this.supabaseService.getAllEntries();
      
      if (error) throw error;
      
      this.entries.set(data as any[]);
    } catch (error) {
      console.error('Error loading all entries:', error);
    }
  }
}