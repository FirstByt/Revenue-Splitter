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
    path: 'my-vaults',
    loadComponent: () => import('./pages/my-vaults/my-vaults.page').then((m) => m.MyVaultsPage),
  },
  {
    path: 'create-vault-success',
    loadComponent: () => import('./pages/create-vault-success/create-vault-success.page').then((m) => m.CreateVaultSuceessPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
