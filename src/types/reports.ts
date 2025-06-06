export interface Transaction {
    id: string;
    from: string;
    to: string;
    amount: number;
    timestamp: Date;
    note?: string;
  }
  
  
  export interface MonthlyTotal {
    month: string;
    totalAmount: number;
  }
  
  export interface RecipientSummary {
    recipientEmail: string;
    totalSent: number;
  }

  export interface TransactionExportRow {
    id: string;
    fromEmail: string;
    toEmail: string;
    amount: number;
    timestamp: string;
    note?: string;
  }
  

  
  