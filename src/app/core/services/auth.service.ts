import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, User, createClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { Profile } from '../../models/supabase.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _session = new BehaviorSubject<AuthSession | null>(null);
  private _user = new BehaviorSubject<User | null>(null);
  private _profile = new BehaviorSubject<Profile | null>(null);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.loadSession();
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this._session.next(session);
      this._user.next(session?.user ?? null);
      if (session?.user) {
        this.fetchProfile(session.user.id);
      } else {
        this._profile.next(null);
      }
    });
  }

  get session$() {
    return this._session.asObservable();
  }

  get user$() {
    return this._user.asObservable();
  }

  get profile$() {
    return this._profile.asObservable();
  }

  get currentUserProfile(): Profile | null {
    return this._profile.value;
  }

  // Helpers for compatibility/ease of use
  isAuthenticated(): boolean {
    return !!this._session.value;
  }

  getCurrentUser(): User | null {
    return this._user.value;
  }

  login(credentials: any) {
    return this.signInWithPassword(credentials.username || credentials.email, credentials.password);
  }

  async loadSession() {
    const { data } = await this.supabase.client.auth.getSession();
    this._session.next(data.session);
    this._user.next(data.session?.user ?? null);
    if (data.session?.user) {
      this.fetchProfile(data.session.user.id);
    }
  }

  async signIn(email: string) {
    // For simplicity, using magic link or passwordless could be an option, 
    // but typically restaurant staff might use email/password.
    // For now, implementing Magic Link for ease of dev testing, or Password if preferred.
    // Let's assume Password for staff.
    // NOTE: This requires the user to be created in Supabase Auth module first manually or via signup.
    return this.supabase.client.auth.signInWithOtp({ email });
  }

  signInWithPassword(email: string, password: string) {
    return from(this.supabase.client.auth.signInWithPassword({
      email,
      password
    }));
  }

  signUp(email: string, password: string) {
    return from(this.supabase.client.auth.signUp({
      email,
      password
    }));
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }

  private async fetchProfile(userId: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      this._profile.next(data as Profile);
    }
  }
}
