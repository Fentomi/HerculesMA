// src/screens/client/ScheduleScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Дневник тренировок</Text>
      <Text style={styles.subtitle}>Здесь будет ваше расписание тренировок</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});