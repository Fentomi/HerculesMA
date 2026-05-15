// src/screens/Messenger/GroupChatDialog.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_URL } from '../../constants/api';
import Icon from 'react-native-vector-icons/Ionicons';

export default function GroupChatDialog({ visible, currentUserId, onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchUsers();
    } else {
      resetForm();
    }
  }, [visible]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/messenger/users?exclude_user_id=${currentUserId}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setSearch('');
    setSelectedUsers([]);
  };

  const toggleSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      Alert.alert('Ошибка', 'Введите название и выберите участников');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/messenger/group-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          participant_ids: selectedUsers,
          creator_id: currentUserId,
        }),
      });
      const data = await res.json();
      onCreated(data.chat_id);
    } catch (err) {
      console.error(err);
      Alert.alert('Ошибка', 'Не удалось создать группу');
    }
  };

  const filteredUsers = users.filter(u =>
    u.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => toggleSelect(item.user_id)}>
      <View style={styles.checkbox}>
        {selectedUsers.includes(item.user_id) && <Icon name="checkbox" size={20} color="#4F46E5" />}
        {!selectedUsers.includes(item.user_id) && <Icon name="square-outline" size={20} color="#9CA3AF" />}
      </View>
      <Text style={styles.userEmail}>{item.user_email}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Создать групповой чат</Text>
          <TextInput
            style={styles.input}
            placeholder="Название группы"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TextInput
            style={styles.input}
            placeholder="Поиск по email"
            value={search}
            onChangeText={setSearch}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.user_id.toString()}
              renderItem={renderUser}
              style={{ maxHeight: 300 }}
            />
          )}
          <View style={styles.stats}>
            <Text>Выбрано: {selectedUsers.length}</Text>
          </View>
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={createGroup}
              style={[styles.createBtn, (!groupName || selectedUsers.length === 0) && styles.disabledBtn]}
              disabled={!groupName || selectedUsers.length === 0}
            >
              <Text style={styles.createBtnText}>Создать</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 12 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkbox: { width: 30, alignItems: 'center' },
  userEmail: { fontSize: 16, marginLeft: 8, flex: 1 },
  stats: { marginTop: 12, marginBottom: 16, alignItems: 'flex-end' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6' },
  createBtn: { padding: 12, borderRadius: 8, backgroundColor: '#4F46E5' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  createBtnText: { color: '#fff', fontWeight: '600' },
});