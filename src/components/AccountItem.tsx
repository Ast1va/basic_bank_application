import { Account } from '@/types';
import { deleteAccountFromFirebase } from '@/firebase/accountService';

interface Props {
  account: Account;
}

const AccountItem = ({ account }: Props) => {
  const handleDelete = async () => {
    const confirmDelete = confirm(`"${account.name}" adlı hesabı silmek istiyor musunuz?`);
    if (!confirmDelete) return;

    try {
      await deleteAccountFromFirebase(account.id);
      window.location.reload(); // geçici çözüm: yeniden fetch için sayfa yenile
    } catch (error) {
      console.error('Hesap silinirken hata oluştu:', error);
    }
  };

  return (
    <div className="border p-4 rounded mb-2 flex justify-between items-center">
      <div>
        <p className="font-semibold">{account.name}</p>
        <p className="text-gray-600">Bakiye: ₺{account.balance}</p>
      </div>
      <button
        onClick={handleDelete}
        className="bg-red-500 text-white px-3 py-1 rounded"
      >
        Sil
      </button>
    </div>
  );
};

export default AccountItem;
