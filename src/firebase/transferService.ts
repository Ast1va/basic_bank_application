import {
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';

// 👇 Hata tipi (explicit any hatasını önlemek için)
interface ErrorWithCode extends Error {
  code?: string;
}

/**
 * Kullanıcıdan kullanıcıya para gönderme işlemi
 */
export const sendMoney = async (
  fromUid: string,
  toEmail: string,
  amount: number,
  note?: string // 👈 açıklama parametresi
) => {
  console.log('🔥 sendMoney() fonksiyonu çalıştı');

  try {
    if (amount <= 0) throw new Error('Gönderilecek tutar 0’dan büyük olmalı.');

    // Alıcı UID'sini e-posta ile bul
    const accountQuery = query(collection(db, 'accounts'), where('email', '==', toEmail));
    const querySnapshot = await getDocs(accountQuery);

    if (querySnapshot.empty) {
      const error: ErrorWithCode = new Error(`Alıcı bulunamadı: ${toEmail}`);
      error.code = 'custom/recipient-not-found';
      throw error;
    }

    const receiverDoc = querySnapshot.docs[0];
    const receiverId = receiverDoc.id;

    if (receiverId === fromUid) {
      throw new Error('Kendinize para gönderemezsiniz.');
    }

    // Hesap güncellemeleri transaction içinde
    await runTransaction(db, async (transaction) => {
      const senderRef = doc(db, 'accounts', fromUid);
      const receiverRef = doc(db, 'accounts', receiverId);

      const senderSnap = await transaction.get(senderRef);
      const receiverSnap = await transaction.get(receiverRef);

      if (!senderSnap.exists() || !receiverSnap.exists()) {
        throw new Error('Gönderici veya alıcı hesabı bulunamadı.');
      }

      const senderBalance = senderSnap.data().balance;
      const receiverBalance = receiverSnap.data().balance;

      if (senderBalance < amount) {
        throw new Error('Yetersiz bakiye.');
      }

      transaction.update(senderRef, { balance: senderBalance - amount });
      transaction.update(receiverRef, { balance: receiverBalance + amount });
    });

    // İşlem geçmişini kaydet (transaction dışı)
    try {
      const ref = await addDoc(collection(db, 'transactions'), {
        from: fromUid,
        to: receiverId,
        amount,
        timestamp: serverTimestamp(),
        note: note || '',
      });
      console.log('✅ Transfer kaydı başarıyla oluşturuldu. ID:', ref.id);
    } catch (err) {
      console.error('❌ addDoc HATASI:', err);
      throw new Error('Transfer geçmişi kaydedilemedi.');
    }

    console.log('🎉 Transfer işlemi başarıyla tamamlandı.');
  } catch (error) {
    console.error('💥 sendMoney genel hata:', error);
    throw error;
  }
};

/**
 * 🔐 Admin paneli için: tüm transfer işlemlerini sırayla getir
 */
export const getAllTransactions = async () => {
  const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as {
      from: string;
      to: string;
      amount: number;
      note?: string;
      timestamp?: { toDate: () => Date };
    }),
  }));
};
