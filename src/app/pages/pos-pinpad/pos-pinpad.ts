import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IzipayService } from '../../services/izipay.service';
import { PaymentResponse } from '../../models/payment-response.interface';

@Component({
  selector: 'app-pos-pinpad',
  imports: [FormsModule],
  templateUrl: './pos-pinpad.html',
  styleUrl: './pos-pinpad.scss'
})
export class PosPinpadComponent {
  private readonly izipayService = inject(IzipayService);

  protected amount = signal<number>(0);
  protected currency = signal<string>('PEN');
  protected merchantId = signal<string>('1000131');
  protected loading = signal<boolean>(false);
  protected response = signal<PaymentResponse | null>(null);
  protected error = signal<string>('');

  processPayment(): void {
    this.loading.set(true);
    this.response.set(null);
    this.error.set('');

    const txId = `REF-${Date.now()}`;

    this.izipayService.processPayment({
      amount: this.amount(),
      currency: this.currency(),
      merchantId: this.merchantId(),
      transactionId: txId
    }).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.friendlyMessage || err.error?.error || err.message || 'Error al procesar el pago');
        this.loading.set(false);
      }
    });
  }

  voidPayment(): void {
    const resp = this.response();
    if (!resp) return;

    this.loading.set(true);
    this.error.set('');

    this.izipayService.voidPayment({
      amount: this.amount(),
      currency: this.currency(),
      merchantId: this.merchantId(),
      transactionId: resp.transactionId
    }).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.friendlyMessage || err.error?.error || 'Error al anular el pago');
        this.loading.set(false);
      }
    });
  }

  cancelPayment(): void {
    this.izipayService.cancelPayment().subscribe({
      next: () => {
        this.loading.set(false);
        this.error.set('');
      },
      error: (err) => {
        this.error.set(err.friendlyMessage || err.error?.error || 'Error al cancelar');
      }
    });
  }

  clear(): void {
    this.response.set(null);
    this.error.set('');
    this.amount.set(0);
  }
}
