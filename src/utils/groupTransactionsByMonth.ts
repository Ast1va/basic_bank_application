import { Transaction } from '@/types/reports';

interface MonthlyTotal {
  month: string; 
  total: number;
}

export const groupTransactionsByMonth = (transactions: Transaction[]): MonthlyTotal[] => {
  const monthlyMap: { [key: string]: number } = {};

  transactions.forEach((tx) => {
    const date = tx.timestamp;
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // "2025-05"

    if (!monthlyMap[month]) {
      monthlyMap[month] = 0;
    }

    monthlyMap[month] += tx.amount;
  });

  // Object'ten diziye çeviriyoruz
  const result: MonthlyTotal[] = Object.entries(monthlyMap).map(([month, total]) => ({
    month,
    total,
  }));

  // Tarih sırasına göre sıralama
  result.sort((a, b) => a.month.localeCompare(b.month));

  return result;
};
