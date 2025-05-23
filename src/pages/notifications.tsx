import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  Notification
} from '@/firebase/notificationService';
import Head from 'next/head';

const NotificationsPage = () => {
  const router = useRouter();
  const { currentUser, loading } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoadingNotifs(true);

    const notifs = await getNotificationsForUser(currentUser.id);
    setNotifications(notifs);

    for (const notif of notifs) {
      if (!notif.readBy?.includes(currentUser.id)) {
        await markNotificationAsRead(notif.id, currentUser.id);
      }
    }

    setLoadingNotifs(false);
  }, [currentUser]);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/login');
    } else {
      fetchNotifications();
    }
  }, [loading, currentUser, fetchNotifications, router]);

  if (!loading && !currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Head>
        <title>Bildirimler | Basic Bank</title>
      </Head>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bildirimler</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
        >
          Geri Dön
        </button>
      </div>

      {loadingNotifs ? (
        <p>Yükleniyor...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-600">Hiç bildirim bulunamadı.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className="p-4 bg-white shadow rounded border"
            >
              <p className="text-sm">{notif.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {notif.timestamp?.toDate().toLocaleString('tr-TR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
