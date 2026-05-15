// src/screens/Messenger/ChatList.js
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import GroupChatDialog from './GroupChatDialog';

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'Ч');
const getAvatarColor = (id) => {
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
  return colors[id % colors.length];
};

export default function ChatList({ chats, users, currentUserId, onSelectChat, onCreateChat, onGroupCreated }) {
  const [search, setSearch] = useState('');
  const [showGroupDialog, setShowGroupDialog] = useState(false);

  const filteredChats = chats.filter(c =>
    c.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const safeUsers = users || [];
  const filteredUsers = safeUsers.filter(u => 
    u && u.user_email && u.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderChat = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => onSelectChat(item)}>
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.chat_id) }]}>
        <Text style={styles.avatarText}>{getInitials(item.display_name)}</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.display_name}</Text>
          <Text style={styles.itemTime}>{formatTime(item.updated_at)}</Text>
        </View>
        <Text style={styles.itemSubtitle} numberOfLines={1}>
          {item.last_message?.is_deleted
            ? '[удалено]'
            : item.last_message?.message_type !== 'text'
            ? getMediaLabel(item.last_message.message_type)
            : item.last_message?.content || 'Нет сообщений'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => onCreateChat(item)}>
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.user_id) }]}>
        <Text style={styles.avatarText}>{getInitials(item.user_email)}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.user_email}</Text>
        <Text style={styles.itemSubtitle}>Написать сообщение</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity onPress={() => setShowGroupDialog(true)} style={styles.addButton}>
          <Icon name="people-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => `chat-${item.chat_id}`}
        renderItem={renderChat}
        ListHeaderComponent={
          filteredChats.length > 0 ? <Text style={styles.sectionHeader}>Чаты</Text> : null
        }
        stickyHeaderIndices={filteredChats.length > 0 ? [0] : []}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => `user-${item.user_id}`}
        renderItem={renderUser}
        ListHeaderComponent={
          filteredUsers.length > 0 ? <Text style={styles.sectionHeader}>Контакты</Text> : null
        }
        stickyHeaderIndices={filteredUsers.length > 0 ? [0] : []}
      />

      {filteredChats.length === 0 && filteredUsers.length === 0 && (
        <Text style={styles.emptyText}>Ничего не найдено</Text>
      )}

      <GroupChatDialog
        visible={showGroupDialog}
        currentUserId={currentUserId}
        onClose={() => setShowGroupDialog(false)}
        onCreated={(chatId) => {
          setShowGroupDialog(false);
          onGroupCreated(chatId);
        }}
      />
    </SafeAreaView>
  );
}

const getMediaLabel = (type) => {
  const map = { image: '📷 Фото', audio: '🎤 Голосовое', file: '📎 Файл' };
  return map[type] || 'Медиа';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: { padding: 8 },
  sectionHeader: {
    backgroundColor: '#F5F7FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  itemTime: { fontSize: 12, color: '#9CA3AF' },
  itemSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
});