import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pos-pinpad/pos-pinpad').then((m) => m.PosPinpadComponent)
  },
  {
    path: 'device',
    loadComponent: () => import('./pages/device-status/device-status').then((m) => m.DeviceStatusComponent)
  }
];
