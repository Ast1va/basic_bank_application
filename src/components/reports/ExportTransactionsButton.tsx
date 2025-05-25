import React from 'react';
import { getUserTransactions } from '@/firebase/reportService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const ExportTransactionsButton = () => {
  const fetchEmail = async (uid: string): Promise<string> => {
    try {
      const ref = doc(db, 'accounts', uid);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data().email || uid : uid;
    } catch {
      return uid;
    }
  };

  const prepareData = async () => {
    const transactions = await getUserTransactions();

    // UID'leri topla
    const allUIDs = Array.from(
      new Set(transactions.flatMap((tx) => [tx.from, tx.to]))
    );

    // UID → Email eşlemesi
    const uidToEmail: { [uid: string]: string } = {};
    await Promise.all(
      allUIDs.map(async (uid) => {
        uidToEmail[uid] = await fetchEmail(uid);
      })
    );

    // Veriyi e-posta formatına çevir
    return transactions.map((tx) => ({
      Gönderen: uidToEmail[tx.from] || tx.from,
      Alıcı: uidToEmail[tx.to] || tx.to,
      Tutar: tx.amount,
      Açıklama: tx.note || '',
      Tarih: tx.timestamp.toLocaleString('tr-TR'),
    }));
  };

  const exportAsExcel = async () => {
    try {
      const data = await prepareData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'İşlemler');

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(blob, 'islem_gecmisi.xlsx');
    } catch (error) {
      console.error('❌ Excel dışa aktarma hatası:', error);
    }
  };

  const exportAsCSV = async () => {
    try {
      const data = await prepareData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // UTF-8 BOM karakteri ekle
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], {
        type: 'text/csv;charset=utf-8;',
      });

      saveAs(blob, 'islem_gecmisi.csv');
    } catch (error) {
      console.error('❌ CSV dışa aktarma hatası:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportAsExcel}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        Excel Olarak Dışa Aktar
      </button>

      <button
        onClick={exportAsCSV}
        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded"
      >
        CSV Olarak Dışa Aktar
      </button>
    </div>
  );
};

export default ExportTransactionsButton;
