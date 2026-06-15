import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { IzipayService } from '../../services/izipay.service';
import { DeviceInfo } from '../../models/device-info.interface';
import { HealthResponse } from '../../models/health-response.interface';

@Component({
  selector: 'app-device-status',
  templateUrl: './device-status.html',
  styleUrl: './device-status.scss'
})
export class DeviceStatusComponent implements OnInit, OnDestroy {
  private readonly izipayService = inject(IzipayService);
  private refreshInterval: any = null;

  readonly health = signal<HealthResponse | null>(null);
  readonly device = signal<DeviceInfo | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly lastRefresh = signal<string>('');
  readonly autoRefresh = signal<boolean>(false);

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');

    this.izipayService.health().subscribe({
      next: (h) => {
        this.health.set(h);
        this.izipayService.deviceInfo().subscribe({
          next: (d) => {
            this.device.set(d);
            this.loading.set(false);
            this.lastRefresh.set(new Date().toLocaleTimeString());
          },
          error: (err) => {
            this.error.set(err.friendlyMessage || err.error?.error || 'Error al obtener info del dispositivo');
            this.loading.set(false);
            this.lastRefresh.set(new Date().toLocaleTimeString());
          }
        });
      },
      error: (err) => {
        this.error.set(err.friendlyMessage || err.error?.error || 'Servicio no disponible');
        this.loading.set(false);
        this.lastRefresh.set(new Date().toLocaleTimeString());
      }
    });
  }

  toggleAutoRefresh(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.autoRefresh.set(checked);
    if (checked) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => this.refresh(), 30000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
