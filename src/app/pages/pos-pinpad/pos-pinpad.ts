import { Component, signal, inject, computed } from '@angular/core';
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

  readonly amount = signal<number>(0);
  readonly currency = signal<string>('PEN');
  readonly merchantId = signal<string>('1000131');
  readonly loading = signal<boolean>(false);
  readonly response = signal<PaymentResponse | null>(null);
  readonly error = signal<string>('');
  readonly amountError = signal<string>('');

  readonly currencyPrefix = computed(() => this.currency() === 'PEN' ? 'S/' : '$');

  processPayment(): void {
    this.amountError.set('');
    if (this.amount() <= 0) {
      this.amountError.set('El monto debe ser mayor a 0');
      return;
    }
    if (this.amount() > 999999.99) {
      this.amountError.set('El monto máximo es 999,999.99');
      return;
    }

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
    this.amountError.set('');
  }
}
