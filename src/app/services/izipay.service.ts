import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaymentRequest } from '../models/payment-request.interface';
import { PaymentResponse } from '../models/payment-response.interface';
import { DeviceInfo } from '../models/device-info.interface';
import { HealthResponse } from '../models/health-response.interface';

@Injectable({ providedIn: 'root' })
export class IzipayService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = this.getBaseUrl();

  private getBaseUrl(): string {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return '/api';
    }
    return 'https://localhost:8383';
  }

  private handleError(error: unknown) {
    let message = 'Error desconocido';
    if (error instanceof ErrorEvent) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    if (message.includes('Failed to fetch') || message.includes('ERR_CERT') || message.includes('net::ERR')) {
      message = 'No se pudo conectar al servicio Izipay. Verifica que la aplicación esté corriendo en tu equipo y que el certificado sea de confianza.';
    }
    return throwError(() => new Error(message));
  }

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  deviceInfo(): Observable<DeviceInfo> {
    return this.http.get<DeviceInfo>(`${this.baseUrl}/device/info`).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/payment/process`, request).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  voidPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/payment/void`, request).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  cancelPayment(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/payment/cancel`, {}).pipe(
      catchError((e) => this.handleError(e))
    );
  }
}
