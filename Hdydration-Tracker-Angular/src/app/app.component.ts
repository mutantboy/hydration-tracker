import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './data/services/supabase-service/supabase-service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Hydration-Tracker-Angular';
  
  //private supabaseService = inject(SupabaseService);
  
  ngOnInit() {
    this.clearInvalidAuthData();
  }
  
  clearInvalidAuthData() {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('supabase') || key.includes('hydration-app-auth')) {
        try {
          JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
          console.log('Clearing invalid auth data:', key);
          localStorage.removeItem(key);
        }
      }
    }
  }
}