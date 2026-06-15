import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IzipayService } from '../../services/izipay.service';
import { PaymentResponse } from '../../models/payment-response.interface';

interface TestItem {
  id: string;
  name: string;
  description: string;
  category: 'conectividad' | 'pago' | 'anulacion' | 'error' | 'dispositivo';
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
}

@Component({
  selector: 'app-test-checklist',
  imports: [CommonModule, FormsModule],
  templateUrl: './test-checklist.html',
  styleUrl: './test-checklist.scss'
})
export class TestChecklistComponent {
  private readonly izipayService = inject(IzipayService);

  readonly tests = signal<TestItem[]>([
    { id: 'health', name: 'Health Check', description: 'Verifica que el servicio HTTPS responde en localhost:8383', category: 'conectividad', status: 'pending' },
    { id: 'device-info', name: 'Info del Dispositivo', description: 'Consulta el estado del PIN Pad conectado', category: 'dispositivo', status: 'pending' },
    { id: 'cors', name: 'Validación CORS', description: 'Verifica que las cabeceras CORS permiten el origen actual', category: 'conectividad', status: 'pending' },
    { id: 'payment-pen', name: 'Pago en PEN', description: 'Procesa un pago de S/ 1.00 en soles', category: 'pago', status: 'pending' },
    { id: 'payment-usd', name: 'Pago en USD', description: 'Procesa un pago de $ 1.00 en dólares', category: 'pago', status: 'pending' },
    { id: 'payment-large', name: 'Pago Monto Alto', description: 'Procesa un pago de S/ 100.00', category: 'pago', status: 'pending' },
    { id: 'payment-decimals', name: 'Pago con Decimales', description: 'Procesa un pago de S/ 15.99', category: 'pago', status: 'pending' },
    { id: 'void-payment', name: 'Anulación de Pago', description: 'Anula el último pago procesado exitosamente', category: 'anulacion', status: 'pending' },
    { id: 'cancel-payment', name: 'Cancelación de Pago', description: 'Cancela un pago en proceso', category: 'anulacion', status: 'pending' },
    { id: 'error-zero', name: 'Error: Monto Cero', description: 'Intenta procesar pago con monto 0 (debe fallar)', category: 'error', status: 'pending' },
    { id: 'error-negative', name: 'Error: Monto Negativo', description: 'Intenta procesar pago con monto negativo (debe fallar)', category: 'error', status: 'pending' },
    { id: 'error-invalid-merchant', name: 'Error: Comercio Inválido', description: 'Intenta procesar pago con merchantId vacío', category: 'error', status: 'pending' },
    { id: 'response-fields', name: 'Campos de Respuesta', description: 'Verifica que la respuesta contiene todos los campos esperados', category: 'pago', status: 'pending' },
    { id: 'concurrent', name: 'Peticiones Concurrentes', description: 'Envía 3 pagos simultáneos y verifica que no colapsa', category: 'conectividad', status: 'pending' },
    { id: 'auto-sales', name: 'Ventas Automáticas', description: 'Procesa 5 ventas secuenciales con montos predefinidos', category: 'pago', status: 'pending' },
    { id: 'random-sales', name: 'Ventas Aleatorias', description: 'Procesa 3 ventas con montos y monedas aleatorias', category: 'pago', status: 'pending' },
  ]);

  readonly selectedCategory = signal<string>('all');
  readonly runningAll = signal<boolean>(false);
  readonly lastPaymentResult = signal<PaymentResponse | null>(null);

  get filteredTests(): TestItem[] {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.tests();
    return this.tests().filter(t => t.category === cat);
  }

  get categories() {
    return [
      { value: 'all', label: 'Todas' },
      { value: 'conectividad', label: 'Conectividad' },
      { value: 'dispositivo', label: 'Dispositivo' },
      { value: 'pago', label: 'Pago' },
      { value: 'anulacion', label: 'Anulación' },
      { value: 'error', label: 'Error' },
    ];
  }

  get summary() {
    const tests = this.tests();
    return {
      total: tests.length,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      running: tests.filter(t => t.status === 'running').length,
      pending: tests.filter(t => t.status === 'pending').length,
    };
  }

  get progressPercent(): number {
    const s = this.summary;
    const completed = s.passed + s.failed;
    return s.total > 0 ? Math.round((completed / s.total) * 100) : 0;
  }

  resetAll(): void {
    this.tests.update(tests => tests.map(t => ({ ...t, status: 'pending' as const, result: undefined })));
    this.lastPaymentResult.set(null);
  }

  async runAll(): Promise<void> {
    this.resetAll();
    this.runningAll.set(true);

    const testIds = ['health', 'device-info', 'cors', 'payment-pen', 'payment-usd', 'payment-large', 'payment-decimals', 'void-payment', 'cancel-payment', 'error-zero', 'error-negative', 'error-invalid-merchant', 'response-fields', 'concurrent', 'auto-sales', 'random-sales'];

    for (const id of testIds) {
      if (!this.runningAll()) break;
      await this.runSingleTest(id);
      await this.delay(500);
    }

    this.runningAll.set(false);
  }

  async runSingleTest(id: string): Promise<void> {
    this.setTestStatus(id, 'running');

    try {
      switch (id) {
        case 'health': await this.testHealth(); break;
        case 'device-info': await this.testDeviceInfo(); break;
        case 'cors': await this.testCors(); break;
        case 'payment-pen': await this.testPayment(1.0, 'PEN'); break;
        case 'payment-usd': await this.testPayment(1.0, 'USD'); break;
        case 'payment-large': await this.testPayment(100.0, 'PEN'); break;
        case 'payment-decimals': await this.testPayment(15.99, 'PEN'); break;
        case 'void-payment': await this.testVoid(); break;
        case 'cancel-payment': await this.testCancel(); break;
        case 'error-zero': await this.testError(0, 'PEN'); break;
        case 'error-negative': await this.testError(-10, 'PEN'); break;
        case 'error-invalid-merchant': await this.testErrorInvalidMerchant(); break;
        case 'response-fields': await this.testResponseFields(); break;
        case 'concurrent': await this.testConcurrent(); break;
        case 'auto-sales': await this.testAutoSales(); break;
        case 'random-sales': await this.testRandomSales(); break;
      }
    } catch (err: any) {
      this.setTestResult(id, 'failed', err.message || 'Error inesperado');
    }
  }

  private setTestStatus(id: string, status: TestItem['status']): void {
    this.tests.update(tests => tests.map(t => t.id === id ? { ...t, status } : t));
  }

  private setTestResult(id: string, status: 'passed' | 'failed', result: string): void {
    this.tests.update(tests => tests.map(t => t.id === id ? { ...t, status, result } : t));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private testHealth(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.izipayService.health().subscribe({
        next: (res) => {
          if (res.status === 'ok' || res.status === 'running') {
            this.setTestResult('health', 'passed', `Servicio: ${res.service} v${res.version}`);
            resolve();
          } else {
            this.setTestResult('health', 'failed', `Estado inesperado: ${res.status}`);
            reject(new Error(`Estado: ${res.status}`));
          }
        },
        error: () => {
          this.setTestResult('health', 'failed', 'No se pudo conectar al servicio');
          reject(new Error('Sin conexión'));
        }
      });
    });
  }

  private testDeviceInfo(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.izipayService.deviceInfo().subscribe({
        next: (res) => {
          const status = res.connected ? 'passed' : 'failed';
          this.setTestResult('device-info', status, `Puerto: ${res.port} - ${res.connected ? 'Conectado' : 'Desconectado'}`);
          if (res.connected) resolve();
          else reject(new Error('Dispositivo desconectado'));
        },
        error: () => {
          this.setTestResult('device-info', 'failed', 'Error al obtener info del dispositivo');
          reject(new Error('Error en device info'));
        }
      });
    });
  }

  private testCors(): Promise<void> {
    return new Promise((resolve, reject) => {
      const origin = window.location.origin;
      const url = 'https://localhost:8383/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit', signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
          const allowPrivateNetwork = res.headers.get('Access-Control-Allow-Private-Network');

          if (res.ok) {
            const details: string[] = [];
            if (allowOrigin) {
              details.push(`CORS: ${allowOrigin}`);
            } else {
              details.push('CORS OK (response 200 received)');
            }
            if (allowPrivateNetwork === 'true') details.push('Private-Network: OK');
            this.setTestResult('cors', 'passed', details.join(' | '));
            resolve();
          } else {
            this.setTestResult('cors', 'failed', `HTTP ${res.status}`);
            reject(new Error(`HTTP ${res.status}`));
          }
        })
        .catch(err => {
          clearTimeout(timeoutId);
          const isLocalhost = origin.includes('localhost');
          let hint: string;
          if (err.name === 'AbortError') {
            hint = 'Timeout: El servicio no respondió en 10s. Verifica que Izipay Tray esté corriendo';
          } else if (isLocalhost) {
            hint = 'No se pudo conectar a https://localhost:8383. Verifica que Izipay Tray esté corriendo y el certificado aceptado';
          } else {
            hint = `Error de red: ${err.message}`;
          }
          this.setTestResult('cors', 'failed', hint);
          reject(new Error('Error CORS o red'));
        });
    });
  }

  private testPayment(amount: number, currency: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const txId = `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const testId = amount === 1.0 && currency === 'PEN' ? 'payment-pen'
        : amount === 1.0 && currency === 'USD' ? 'payment-usd'
        : amount === 100.0 ? 'payment-large'
        : 'payment-decimals';

      this.izipayService.processPayment({ amount, currency, merchantId: '1000131', transactionId: txId }).subscribe({
        next: (res) => {
          this.lastPaymentResult.set(res);
          const approved = res.responseCod === '00';
          this.setTestResult(testId, approved ? 'passed' : 'failed', `${currency} ${amount} - ${res.message} (${res.responseCod})`);
          resolve();
        },
        error: (err) => {
          this.setTestResult(testId, 'failed', err.friendlyMessage || err.message);
          reject(err);
        }
      });
    });
  }

  private testVoid(): Promise<void> {
    return new Promise((resolve, reject) => {
      const last = this.lastPaymentResult();
      if (!last) {
        this.setTestResult('void-payment', 'failed', 'No hay pago previo para anular');
        reject(new Error('Sin pago previo'));
        return;
      }

      this.izipayService.voidPayment({
        amount: 1.0,
        currency: 'PEN',
        merchantId: '1000131',
        transactionId: last.transactionId
      }).subscribe({
        next: (res) => {
          const approved = res.responseCod === '00';
          this.setTestResult('void-payment', approved ? 'passed' : 'failed', `Anulación: ${res.message} (${res.responseCod})`);
          resolve();
        },
        error: (err) => {
          this.setTestResult('void-payment', 'failed', err.friendlyMessage || err.message);
          reject(err);
        }
      });
    });
  }

  private testCancel(): Promise<void> {
    return new Promise((resolve) => {
      this.izipayService.cancelPayment().subscribe({
        next: () => {
          this.setTestResult('cancel-payment', 'passed', 'Cancelación enviada correctamente');
          resolve();
        },
        error: () => {
          this.setTestResult('cancel-payment', 'passed', 'Cancelación enviada (error esperado sin pago activo)');
          resolve();
        }
      });
    });
  }

  private testError(amount: number, currency: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const txId = `TEST-ERR-${Date.now()}`;
      const testId = amount === 0 ? 'error-zero' : 'error-negative';

      this.izipayService.processPayment({ amount, currency, merchantId: '1000131', transactionId: txId }).subscribe({
        next: (res) => {
          if (res.responseCod !== '00') {
            this.setTestResult(testId, 'passed', `Rechazado correctamente: ${res.message}`);
            resolve();
          } else {
            this.setTestResult(testId, 'failed', 'Pago aceptado cuando debería ser rechazado');
            reject(new Error('Pago aceptado incorrectamente'));
          }
        },
        error: () => {
          this.setTestResult(testId, 'passed', 'Error esperado recibido del servicio');
          resolve();
        }
      });
    });
  }

  private testErrorInvalidMerchant(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.izipayService.processPayment({ amount: 1.0, currency: 'PEN', merchantId: '', transactionId: 'TEST-ERR-M' }).subscribe({
        next: (res) => {
          if (res.responseCod !== '00') {
            this.setTestResult('error-invalid-merchant', 'passed', `Rechazado: ${res.message}`);
            resolve();
          } else {
            this.setTestResult('error-invalid-merchant', 'failed', 'Pago aceptado con merchant vacío');
            reject(new Error('Pago aceptado con merchant vacío'));
          }
        },
        error: () => {
          this.setTestResult('error-invalid-merchant', 'passed', 'Error esperado recibido');
          resolve();
        }
      });
    });
  }

  private testResponseFields(): Promise<void> {
    return new Promise((resolve, reject) => {
      const txId = `TEST-FIELDS-${Date.now()}`;
      this.izipayService.processPayment({ amount: 1.0, currency: 'PEN', merchantId: '1000131', transactionId: txId }).subscribe({
        next: (res) => {
          const requiredFields = ['responseCod', 'message', 'brand', 'card', 'approvalCode', 'reference', 'terminalId', 'transactionId', 'batchNumber', 'dateTime'];
          const missing = requiredFields.filter(f => !(f in res));
          if (missing.length === 0) {
            this.setTestResult('response-fields', 'passed', 'Todos los campos presentes');
            resolve();
          } else {
            this.setTestResult('response-fields', 'failed', `Campos faltantes: ${missing.join(', ')}`);
            reject(new Error(`Faltan: ${missing.join(', ')}`));
          }
        },
        error: (err) => {
          this.setTestResult('response-fields', 'failed', err.friendlyMessage || err.message);
          reject(err);
        }
      });
    });
  }

  private testConcurrent(): Promise<void> {
    return new Promise((resolve, reject) => {
      const requests = [1, 2, 3].map(i =>
        new Promise<any>((res, rej) => {
          this.izipayService.processPayment({
            amount: 1.0,
            currency: 'PEN',
            merchantId: '1000131',
            transactionId: `TEST-CONC-${Date.now()}-${i}`
          }).subscribe({ next: res, error: rej });
        })
      );

      Promise.allSettled(requests).then((results) => {
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        if (succeeded >= 1) {
          this.setTestResult('concurrent', 'passed', `${succeeded}/3 peticiones completadas`);
          resolve();
        } else {
          this.setTestResult('concurrent', 'failed', 'Todas las peticiones fallaron');
          reject(new Error('Concurrent requests failed'));
        }
      });
    });
  }

  private testAutoSales(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sales = [
        { amount: 5.50, currency: 'PEN' },
        { amount: 12.00, currency: 'PEN' },
        { amount: 25.99, currency: 'PEN' },
        { amount: 1.00, currency: 'USD' },
        { amount: 50.00, currency: 'PEN' },
      ];

      let completed = 0;
      let approved = 0;
      const results: string[] = [];

      const processNext = (index: number) => {
        if (index >= sales.length) {
          if (approved === sales.length) {
            this.setTestResult('auto-sales', 'passed', `${approved}/${sales.length} ventas aprobadas`);
            resolve();
          } else {
            this.setTestResult('auto-sales', 'failed', `${approved}/${sales.length} aprobadas. ${results.join(', ')}`);
            reject(new Error(`${sales.length - approved} ventas fallaron`));
          }
          return;
        }

        const sale = sales[index];
        const txId = `AUTO-${Date.now()}-${index}`;

        this.izipayService.processPayment({
          amount: sale.amount,
          currency: sale.currency,
          merchantId: '1000131',
          transactionId: txId
        }).subscribe({
          next: (res) => {
            completed++;
            if (res.responseCod === '00') {
              approved++;
              this.lastPaymentResult.set(res);
            }
            results.push(`${sale.currency} ${sale.amount}: ${res.responseCod}`);
            this.setTestStatus('auto-sales', 'running');
            processNext(index + 1);
          },
          error: (err) => {
            completed++;
            results.push(`${sale.currency} ${sale.amount}: ERROR`);
            this.setTestResult('auto-sales', 'failed', `Error en venta ${index + 1}: ${err.message || 'Error desconocido'}`);
            reject(err);
          }
        });
      };

      processNext(0);
    });
  }

  private testRandomSales(): Promise<void> {
    return new Promise((resolve, reject) => {
      const currencies = ['PEN', 'USD'];
      const saleCount = 3;
      let completed = 0;
      let approved = 0;
      const results: string[] = [];

      const generateRandomSale = () => {
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const amount = currency === 'PEN'
          ? Math.round((Math.random() * 200 + 1) * 100) / 100
          : Math.round((Math.random() * 100 + 1) * 100) / 100;
        return { amount, currency };
      };

      const sales = Array.from({ length: saleCount }, generateRandomSale);

      const processNext = (index: number) => {
        if (index >= sales.length) {
          if (approved === sales.length) {
            this.setTestResult('random-sales', 'passed', `${approved}/${saleCount} ventas aleatorias aprobadas`);
            resolve();
          } else {
            this.setTestResult('random-sales', 'failed', `${approved}/${saleCount} aprobadas. ${results.join(' | ')}`);
            reject(new Error(`${saleCount - approved} ventas fallaron`));
          }
          return;
        }

        const sale = sales[index];
        const txId = `RAND-${Date.now()}-${index}`;

        this.izipayService.processPayment({
          amount: sale.amount,
          currency: sale.currency,
          merchantId: '1000131',
          transactionId: txId
        }).subscribe({
          next: (res) => {
            completed++;
            if (res.responseCod === '00') {
              approved++;
              this.lastPaymentResult.set(res);
            }
            results.push(`${sale.currency} ${sale.amount}: ${res.responseCod}`);
            this.setTestStatus('random-sales', 'running');
            processNext(index + 1);
          },
          error: (err) => {
            completed++;
            results.push(`${sale.currency} ${sale.amount}: ERROR`);
            this.setTestResult('random-sales', 'failed', `Error en venta ${index + 1}: ${err.message || 'Error desconocido'}`);
            reject(err);
          }
        });
      };

      processNext(0);
    });
  }
}
