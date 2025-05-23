import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    updateDoc,
    doc,
    arrayUnion,
    Timestamp
  } from 'firebase/firestore';
  import { db } from './config';
  
  // 🔐 Bildirim tipi
  export interface Notification {
    id: string;
    message: string;
    userId?: string | null;
    timestamp: Timestamp;
    readBy?: string[];
  }
  
  const notificationsRef = collection(db, 'notifications');
  
  /**
   * Bildirim gönder (admin kullanır)
   */
  export async function sendNotification(message: string, userId?: string) {
    try {
      await addDoc(notificationsRef, {
        message,
        userId: userId || null,
        timestamp: Timestamp.now(),
        readBy: []
      });
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcıya gelen bildirimleri al (herkese açık ve kendine özel)
   */
  export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    try {
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
  
      const docs = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Notification, 'id'>)
        }))
        .filter((n) => n.userId === null || n.userId === userId);
  
      return docs;
    } catch (error) {
      console.error('Bildirimler alınamadı:', error);
      throw error;
    }
  }
  
  /**
   * Bildirimi okundu olarak işaretle (readBy dizisine ekle)
   */
  export async function markNotificationAsRead(notificationId: string, userId: string) {
    try {
      const ref = doc(db, 'notifications', notificationId);
      await updateDoc(ref, {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcının okunmamış bildirim sayısını al
   */
  export async function getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const q = query(notificationsRef);
      const snapshot = await getDocs(q);
  
      const docs = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Notification, 'id'>)
        }))
        .filter(
          (n) =>
            (n.userId === null || n.userId === userId) &&
            (!n.readBy || !n.readBy.includes(userId))
        );
  
      return docs.length;
    } catch (error) {
      console.error('Okunmamış bildirim sayısı alınamadı:', error);
      return 0;
    }
  }
  