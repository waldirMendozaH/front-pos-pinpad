import { Component, signal, inject, OnInit } from '@angular/core';
import { IzipayService } from '../../services/izipay.service';
import { DeviceInfo } from '../../models/device-info.interface';
import { HealthResponse } from '../../models/health-response.interface';

@Component({
  selector: 'app-device-status',
  templateUrl: './device-status.html',
  styleUrl: './device-status.scss'
})
export class DeviceStatusComponent implements OnInit {
  private readonly izipayService = inject(IzipayService);

  protected health = signal<HealthResponse | null>(null);
  protected device = signal<DeviceInfo | null>(null);
  protected loading = signal<boolean>(false);
  protected error = signal<string>('');

  ngOnInit(): void {
    this.refresh();
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
          },
          error: (err) => {
            this.error.set(err.error?.error || 'Error al obtener info del dispositivo');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Servicio no disponible');
        this.loading.set(false);
      }
    });
  }
}
