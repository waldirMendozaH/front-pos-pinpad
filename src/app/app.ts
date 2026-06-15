import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IzipayService } from './services/izipay.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly izipayService = inject(IzipayService);
  private checkInterval: any = null;

  protected serviceOnline = signal<boolean>(false);
  protected checkingService = signal<boolean>(true);

  ngOnInit(): void {
    this.checkServiceStatus();
    this.checkInterval = setInterval(() => this.checkServiceStatus(), 30000);
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkServiceStatus(): void {
    this.checkingService.set(true);
    this.izipayService.health().subscribe({
      next: () => {
        this.serviceOnline.set(true);
        this.checkingService.set(false);
      },
      error: () => {
        this.serviceOnline.set(false);
        this.checkingService.set(false);
      }
    });
  }
}
