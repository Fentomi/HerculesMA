// src/screens/Messenger/ChatWindow.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatWindow({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onBack,
}) {
  const scrollViewRef = useRef();

  useEffect(() => {
    // Скролл вниз при новых сообщениях
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'Ч');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(chat.display_name)}</Text>
        </View>
        <Text style={styles.title}>{chat.display_name}</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageArea}
        contentContainerStyle={styles.messageAreaContent}
      >
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
        />
      </ScrollView>
      <MessageInput onSend={onSendMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { marginRight: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  messageArea: { flex: 1, backgroundColor: '#F5F7FA' },
  messageAreaContent: { paddingVertical: 12 },
});