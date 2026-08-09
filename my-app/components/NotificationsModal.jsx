import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {useNotificationStore} from "../lib/notificationStore.js"

export default function NotificationsModal({ visible, onClose }) {
  const { notifications, markAsRead, clearAll } = useNotificationStore();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.itemUnread]}
      onPress={() => !item.is_read && markAsRead(item.id)}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {!item.is_read && <View style={styles.dot} />}
      </View>
      {item.message ? <Text style={styles.itemMessage}>{item.message}</Text> : null}
      <Text style={styles.itemDate}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No notifications yet</Text>
            }
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearButton: { alignSelf: 'flex-end', marginBottom: 8 },
  clearButtonText: { color: '#ef4444', fontWeight: '600' },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemUnread: { backgroundColor: '#f0fdf4' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  itemMessage: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  itemDate: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 32 },
});