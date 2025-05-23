import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUnreadNotificationCount } from '@/firebase/notificationService';
import { useUserStore } from '@/store/useUserStore';

const NotificationButton = () => {
  const { currentUser } = useUserStore();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!currentUser) return;

    const fetchCount = async () => {
      const count = await getUnreadNotificationCount(currentUser.id);
      setUnreadCount(count);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <Link href="/notifications" passHref>
      <div className="relative inline-block cursor-pointer">
        <button className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded">
          🔔 Bildirimler
        </button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
};

export default NotificationButton;
