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

  
  