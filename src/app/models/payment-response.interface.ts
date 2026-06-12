export interface PaymentResponse {
  responseCod: string;
  message: string;
  brand: string;
  card: string;
  approvalCode: string;
  reference: string;
  dateTime: string;
  terminalId: string;
  transactionId: string;
  batchNumber: string;
  printData: string;
  readType: string;
  numInstallments: string;
}
