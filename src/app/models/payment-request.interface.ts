export interface PaymentRequest {
  amount: number;
  currency: string;
  merchantId: string;
  transactionId: string;
  email?: string;
  phone?: string;
}
