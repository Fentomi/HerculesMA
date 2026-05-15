// src/screens/Messenger/MessageList.js
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import MessageItem from './MessageItem';

export default function MessageList({ messages, currentUserId, onEdit, onDelete }) {
  if (messages.length === 0) {
    return <Text style={styles.emptyText}>Нет сообщений. Напишите что-нибудь :)</Text>;
  }
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.message_id.toString()}
      renderItem={({ item }) => (
        <MessageItem
          message={item}
          isMine={item.is_mine}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      inverted // новые сообщения снизу
      contentContainerStyle={{ paddingHorizontal: 12 }}
    />
  );
}

const styles = { emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 } };