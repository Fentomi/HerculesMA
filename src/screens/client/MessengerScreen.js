// src/screens/client/MessengerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

export default function MessengerScreen() {
  const { user } = useAuth();
  const currentUserId = user?.user_id;

  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');

  useEffect(() => {
    if (!currentUserId) return;
    console.log(`currentUserId: ${currentUserId}`);
    
    const loadData = async () => {
      await Promise.all([fetchChats(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, [currentUserId]);

  const fetchChats = async () => {
    try {
      const numericUserId = Number(currentUserId);
      const url = `${API_URL}/messenger/chats/${numericUserId}`;
      console.log('Fetching chats from:', url);
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('HTTP error:', res.status, errorText);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log('Fetched chats data:', data);
      setChats(data);
    } catch (err) {
      console.error('fetchChats error:', err.message);
      setChats([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = `${API_URL}/messenger/users?exclude_user_id=${currentUserId}`;
      console.log('Fetching users from:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      console.log('Raw users response:', text.substring(0, 200));
      const cleanText = text.replace(/^\uFEFF/, '');
      const data = JSON.parse(cleanText);
      console.log('Parsed users data (length):', data.length);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchUsers error:', err.message);
      setUsers([]);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/messenger/chats/${chatId}/messages?user_id=${currentUserId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    fetchMessages(chat.chat_id);
    setView('chat');
  };

  const createChatWithUser = async (userObj) => {
    try {
      const res = await fetch(`${API_URL}/messenger/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_user_id: currentUserId,
          other_user_id: userObj.user_id,
        }),
      });
      const data = await res.json();
      await fetchChats();
      const newChat = chats.find(c => c.chat_id === data.chat_id);
      if (newChat) selectChat(newChat);
    } catch (err) {
      console.error(err);
      alert('Не удалось создать чат');
    }
  };

  const onGroupCreated = async (chatId) => {
    await fetchChats();
    const newChat = chats.find(c => c.chat_id === chatId);
    if (newChat) selectChat(newChat);
  };

  const sendMessage = async (content, type, file) => {
    if (!activeChat) return;
    const formData = new FormData();
    formData.append('sender_id', currentUserId);
    if (file) {
      formData.append('file', file);
    } else {
      formData.append('message_type', type);
      formData.append('content', content);
    }
    try {
      await fetch(`${API_URL}/messenger/chats/${activeChat.chat_id}/messages`, {
        method: 'POST',
        body: formData,
      });
      await fetchMessages(activeChat.chat_id);
    } catch (err) {
      console.error(err);
    }
  };

  const editMessage = async (messageId, newContent) => {
    try {
      await fetch(`${API_URL}/messenger/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, content: newContent }),
      });
      await fetchMessages(activeChat.chat_id);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await fetch(`${API_URL}/messenger/messages/${messageId}?user_id=${currentUserId}`, {
        method: 'DELETE',
      });
      await fetchMessages(activeChat.chat_id);
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text>Загрузка пользователя...</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {view === 'list' ? (
        <ChatList
          chats={chats}
          users={users}
          currentUserId={currentUserId}
          onSelectChat={selectChat}
          onCreateChat={createChatWithUser}
          onGroupCreated={onGroupCreated}
        />
      ) : (
        <ChatWindow
          chat={activeChat}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={sendMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          onBack={() => setView('list')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});