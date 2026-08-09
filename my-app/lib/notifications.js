import { supabase } from "./auth-store";

// Call this from ANYWHERE in the app to create a notification
export async function addNotification({ userId, title, message, type = 'general' }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type })
    .select()
    .single();

  if (error) {
    console.error('addNotification error:', error);
    return null;
  }
  return data;
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchNotifications error:', error);
    return [];
  }
  return data;
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) console.error('markNotificationRead error:', error);
  return !error;
}

export async function clearAllNotifications(userId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) console.error('clearAllNotifications error:', error);
  return !error;
}