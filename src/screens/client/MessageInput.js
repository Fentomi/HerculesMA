// src/screens/Messenger/MessageInput.js
import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef();

  const sendMessage = () => {
    if (message.trim()) {
      onSend(message, 'text', null);
      setMessage('');
    }
  };

//   const pickFile = async () => {
//     try {
//       const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
//         if (res.type === 'success') {
//         const file = {
//             uri: res.uri,
//             type: res.mimeType,
//             name: res.name,
//         };
//         onSend(null, null, file);
//         }
//     } catch (err) {
//       if (DocumentPicker.isCancel(err)) return;
//       Alert.alert('Ошибка', 'Не удалось выбрать файл');
//     }
//   };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowEmoji(!showEmoji)} style={styles.iconButton}>
        <Icon name="happy-outline" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
        <Icon name="attach-outline" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Сообщение"
        multiline
      />
      <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
        <Icon name="send" size={24} color="#4F46E5" />
      </TouchableOpacity>
      {showEmoji && (
        <View style={styles.emojiPanel}>
          {['😀', '😂', '😍', '😎', '👍', '❤️', '🔥', '🎉'].map(emoji => (
            <TouchableOpacity key={emoji} onPress={() => addEmoji(emoji)} style={styles.emojiBtn}>
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  iconButton: { padding: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxHeight: 100,
    fontSize: 16,
    marginHorizontal: 8,
  },
  sendButton: { padding: 8 },
  emojiPanel: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 250,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  emojiBtn: { padding: 8 },
  emoji: { fontSize: 24 },
});