import { Routes } from '@angular/router';
import { authGuard } from './data/guards/auth.guard';
import { adminGuard } from './data/guards/admin.guard';
import { AuthComponent } from './ui/auth/auth.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth',
        pathMatch: 'full'
        //component: AuthComponent
    },
    {
      path: 'auth',
      loadComponent: () => import('./ui/auth/auth.component').then(m => m.AuthComponent)
    },
    {
      path: 'auth/callback',
      loadComponent: () => import('./ui/auth/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
    },
    {
      path: 'auth/update-password',
      loadComponent: () => import('./ui/auth/update-password/update-password.component').then(m => m.UpdatePasswordComponent)
    },
    {
      path: 'dashboard',
      loadComponent: () => import('./ui/dashboard/dashboard.component').then(m => m.DashboardComponent),
      canActivate: [authGuard]
    },
    {
      path: 'profile',
      loadComponent: () => import('./ui/profile/profile.component').then(m => m.ProfileComponent),
      canActivate: [authGuard]
    },
    {
      path: 'admin',
      loadComponent: () => import('./ui/admin/admin.component').then(m => m.AdminComponent),
      canActivate: [authGuard, adminGuard]
    },
    {
      path: '**',
      redirectTo: '/dashboard'
    }
  ];
