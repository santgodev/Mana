import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { UserRole } from '../../models/supabase.types';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(private auth: AuthService, private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.auth.profile$.pipe(
            take(1),
            map(profile => {
                if (!profile) {
                    this.router.navigate(['/login']);
                    return false;
                }

                const expectedRoles = route.data['roles'] as UserRole[];

                if (!expectedRoles || expectedRoles.length === 0) {
                    return true; // No roles required
                }

                const hasRole = expectedRoles.includes(profile.role);

                if (!hasRole) {
                    // Redirect to home or specific dashboard based on role could be better
                    // For now, redirect to root which might redirect to tables
                    console.warn(`User ${profile.username} with role ${profile.role} denied access to ${state.url}`);
                    this.router.navigate(['/']);
                    return false;
                }

                return true;
            })
        );
    }
}
