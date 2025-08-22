import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'select',
    loadComponent: () => import('./pages/select-receipiants/select-receipiants.page').then((m) => m.SelectReceipiantsPage),
  },
    {
    path: 'create-vault',
    loadComponent: () => import('./pages/create-vault/create-vault.page').then((m) => m.CreateVaultPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
