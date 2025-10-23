import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // ユーザーがログアウトした時だけ、通知をクリアする
  useEffect(() => {
    if (!user) {
      setNotifications([]);
    }
  }, [user]);

  // ユーザーIDに基づいてリアルタイム購読を管理する
  useEffect(() => {
    // ユーザーIDがなければ何もしない
    if (!user?.id) {
      return;
    }

    const handleRealtimeEvent = async (payload) => {
      const eventType = payload.eventType;
      const newData = payload.new;
      const tableName = payload.table;
      let message = '';
      let link = '';

      try {
        if (tableName === 'commitments') {
          link = '/commitments';
          if (eventType === 'INSERT') {
            const { data: profile, error } = await supabase.from('profiles').select('username').eq('id', newData.requester_id).single();
            if (error) throw error;
            message = `${profile.username}さんから申請が届きました。`;
          } else if (eventType === 'UPDATE') {
            const { data: profile, error } = await supabase.from('profiles').select('username').eq('id', newData.addressee_id).single();
            if (error) throw error;
            if (newData.status === 'ACTIVE') message = `${profile.username}さんが申請を承認しました。`;
            else if (newData.status === 'REJECTED') message = `${profile.username}さんが申請を拒否しました。`;
          }
        } else if (tableName === 'reviews' && eventType === 'INSERT') {
          link = '/profile';
          const { data: profile, error } = await supabase.from('profiles').select('username').eq('id', newData.reviewer_id).single();
          if (error) throw error;
          message = `${profile.username}さんから評価が届きました。`;
        }

        if (message) {
          const newNotification = {
            id: `${eventType}-${tableName}-${newData.id}-${Date.now()}`,
            message,
            link,
            createdAt: newData.created_at,
          };
          setNotifications(prev => [...prev, newNotification]);
        }
      } catch (err) {
        console.error('Error processing realtime event:', err);
      }
    };

    const channel = supabase.channel(`user-notifications:${user.id}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commitments', filter: `addressee_id=eq.${user.id}` }, handleRealtimeEvent)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'commitments', filter: `requester_id=eq.${user.id}` }, handleRealtimeEvent)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `reviewee_id=eq.${user.id}` }, handleRealtimeEvent)
      .subscribe();

    // クリーンアップ関数
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // userオブジェクトではなく、不変のuser.idに依存する

  const value = {
    notifications,
    clearNotifications: () => setNotifications([]),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationContext);
};