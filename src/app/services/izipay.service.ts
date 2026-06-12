import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest } from '../models/payment-request.interface';
import { PaymentResponse } from '../models/payment-response.interface';
import { DeviceInfo } from '../models/device-info.interface';
import { HealthResponse } from '../models/health-response.interface';

@Injectable({ providedIn: 'root' })
export class IzipayService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  deviceInfo(): Observable<DeviceInfo> {
    return this.http.get<DeviceInfo>(`${this.baseUrl}/device/info`);
  }

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/payment/process`, request);
  }

  voidPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/payment/void`, request);
  }

  cancelPayment(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/payment/cancel`, {});
  }
}
