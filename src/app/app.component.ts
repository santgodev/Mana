import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'inventario-app';

  constructor(private supabaseService: SupabaseService) {
    this.supabaseService.client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error connecting to Supabase:', error);
      }
    });
  }
}
