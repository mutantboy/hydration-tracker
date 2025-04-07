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
      
      const transformedEntries = data.map(entry => ({
        ...entry,
        userEmail: entry.profiles?.email || entry.user_id
      }));
      
      this.entries.set(transformedEntries);
    } catch (error) {
      console.error('Error loading all entries:', error);
    }
  }
    /*async loadAllEntries() {
      try {
        console.log('Attempting to load all entries');
        const { data, error } = await this.supabaseService.getAllEntries();
        
        console.log('Query result:', { data, error });
        
        if (error) throw error;
        
        this.entries.set(data);
      } catch (error) {
        console.error('Error loading all entries:', error);
      }
    }*/
}