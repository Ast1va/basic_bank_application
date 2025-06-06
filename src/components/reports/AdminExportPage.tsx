import { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/config";
import { saveAs } from "file-saver";
import { TransactionExportRow } from "../../types/reports";
import * as XLSX from "xlsx";

const AdminExportPage = () => {
  const [transactions, setTransactions] = useState<TransactionExportRow[]>([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    count: 0,
    activeMonths: 0,
    sentByUser: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Tüm işlemler
      const txSnap = await getDocs(collection(db, "transactions"));
      const txList = txSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          from: d.from,
          to: d.to,
          amount: d.amount,
          timestamp: d.timestamp
            ? new Date(d.timestamp.seconds ? d.timestamp.seconds * 1000 : d.timestamp).toISOString()
            : "",
          note: d.note || "",
        };
      });

      // UID-email eşlemesi
      const accountsSnap = await getDocs(collection(db, "accounts"));
      const uidEmailMap: Record<string, string> = {};
      accountsSnap.docs.forEach(doc => {
        const data = doc.data();
        uidEmailMap[doc.id] = data.email;
      });

      // Export verisi
      const exportList: TransactionExportRow[] = txList.map(tx => ({
        id: tx.id,
        fromEmail: uidEmailMap[tx.from] || tx.from,
        toEmail: uidEmailMap[tx.to] || tx.to,
        amount: tx.amount,
        timestamp: tx.timestamp,
        note: tx.note || "",
      }));

      setTransactions(exportList);

      // İstatistikler
      const totalSent = exportList.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const count = exportList.length;
      const months = new Set(exportList.map(tx => tx.timestamp?.slice(0, 7)));
      const sentByUser: Record<string, number> = {};
      exportList.forEach(tx => {
        sentByUser[tx.fromEmail] = (sentByUser[tx.fromEmail] || 0) + (tx.amount || 0);
      });

      setStats({
        totalSent,
        count,
        activeMonths: months.size,
        sentByUser,
      });

      setLoading(false);
    };
    fetchData();
  }, []);

  // Exporta ekstra istatistik ekle
  const getExportWithStats = () => {
    const rows = [...transactions];
    rows.push({ id: "", fromEmail: "", toEmail: "", amount: 0, timestamp: "", note: "" });
    rows.push({ id: "Toplam Gönderim", fromEmail: "", toEmail: "", amount: stats.totalSent, timestamp: "", note: "" });
    rows.push({ id: "İşlem Sayısı", fromEmail: "", toEmail: "", amount: stats.count, timestamp: "", note: "" });
    rows.push({ id: "Aktif Aylar", fromEmail: "", toEmail: "", amount: stats.activeMonths, timestamp: "", note: "" });
    Object.entries(stats.sentByUser).forEach(([email, total]) => {
      rows.push({
        id: "Kullanıcı Toplam Gönderim",
        fromEmail: email,
        toEmail: "",
        amount: total,
        timestamp: "",
        note: "",
      });
    });
    return rows;
  };

  const toCSV = (rows: TransactionExportRow[]) => {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","),
      ...rows.map(row => headers.map(field => `"${row[field as keyof TransactionExportRow] ?? ""}"`).join(","))
    ];
    return csvRows.join("\n");
  };

  const handleExportCSV = () => {
    const exportRows = getExportWithStats();
    const csv = toCSV(exportRows);
    const BOM = "\uFEFF"; // UTF-8 BOM ekle
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "tum-islemler.csv"); // Türkçe dosya adı
  };

  const handleExportExcel = () => {
    const exportRows = getExportWithStats();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tüm İşlemler");
    XLSX.writeFile(wb, "tum-islemler.xlsx"); // Türkçe dosya adı
  };

  return (
    <div className="mb-4">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded shadow mb-2"
        onClick={handleExportCSV}
        disabled={loading}
      >
        CSV Olarak İndir
      </button>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded shadow ml-2 mb-2"
        onClick={handleExportExcel}
        disabled={loading}
      >
        Excel Olarak İndir
      </button>
    </div>
  );
};

export default AdminExportPage;
