// src/screens/Messenger/MessageItem.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const API_URL = 'http://localhost:5000';

export default function MessageItem({ message, isMine, onEdit, onDelete }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const getInitials = (email) => email?.slice(0, 2).toUpperCase() || 'U';
  const getAvatarColor = (id) => {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
    return colors[id % colors.length];
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getFullUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  const handleEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.message_id, editContent);
    }
    setEditModalVisible(false);
  };

  const handleDelete = () => {
    Alert.alert('Удалить сообщение?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => onDelete(message.message_id) },
    ]);
  };

  return (
    <View style={[styles.messageRow, isMine ? styles.mineRow : styles.otherRow]}>
      {!isMine && (
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(message.sender_id) }]}>
            <Text style={styles.avatarText}>{getInitials(message.sender_email)}</Text>
          </View>
          <Text style={styles.senderEmail} numberOfLines={1}>
            {message.sender_email}
          </Text>
        </View>
      )}
      <View style={[styles.bubble, isMine ? styles.mineBubble : styles.otherBubble]}>
        {message.message_type === 'text' && <Text style={styles.messageText}>{message.content}</Text>}
        {message.message_type === 'image' && (
          <TouchableOpacity onPress={() => alert('preview')}>
            <Image source={{ uri: getFullUrl(message.content) }} style={styles.imagePreview} />
          </TouchableOpacity>
        )}
        {message.message_type === 'audio' && (
          <audio controls src={getFullUrl(message.content)} style={styles.audioPlayer} />
        )}
        {message.message_type === 'file' && (
          <TouchableOpacity>
            <Text style={styles.fileLink}>📎 Файл</Text>
          </TouchableOpacity>
        )}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(message.created_at)}</Text>
          {message.updated_at && message.updated_at !== message.created_at && (
            <Text style={styles.editedMark}> (ред.)</Text>
          )}
        </View>
        {isMine && (
          <View style={styles.actions}>
            {message.message_type === 'text' && (
              <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.actionBtn}>
                <Icon name="create-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <Icon name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Модалка редактирования */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Редактировать сообщение</Text>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEdit} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 8 },
  mineRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  avatarWrapper: { alignItems: 'center', marginRight: 8, width: 50 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  senderEmail: { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 2, maxWidth: 50 },
  bubble: { maxWidth: '70%', padding: 8, borderRadius: 18, position: 'relative' },
  mineBubble: { backgroundColor: '#DCF8C5', alignSelf: 'flex-end' },
  otherBubble: { backgroundColor: '#F1F0F0', alignSelf: 'flex-start' },
  messageText: { fontSize: 14, color: '#1A1A1A' },
  imagePreview: { width: 200, height: 150, borderRadius: 12, marginVertical: 4 },
  audioPlayer: { width: 200, height: 40 },
  fileLink: { color: '#4F46E5', textDecorationLine: 'underline' },
  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 10, color: '#6B7280' },
  editedMark: { fontSize: 10, color: '#9CA3AF' },
  actions: { flexDirection: 'row', position: 'absolute', bottom: -20, right: 5 },
  actionBtn: { marginHorizontal: 4 },
  // У себя на мобильных устройствах кнопки действий показываем при длительном нажатии или всегда – для простоты сделаем видимыми всегда
  // Можно переделать на TouchableHighlight, но оставим для демонстрации
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  editInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 8, minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn: { padding: 8 },
  saveBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
// Чтобы кнопки действий были видны, можно раскомментировать следующий блок:
// styles.bubble:hover .actions { display: flex; } – в RN нет hover, поэтому сделаем видимыми всегда: